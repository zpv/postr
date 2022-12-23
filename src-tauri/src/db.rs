use crate::error::{Error, Result};
use crate::event::{self, single_char_tagname, Event};
use crate::subscription::{ReqFilter, Subscription};
use crate::notice::Notice;
use crate::hexrange::hex_range;
use crate::hexrange::HexSearch;
use crate::schema::{upgrade_db, STARTUP_SQL};
use crate::utils::{is_hex, is_lower_hex};
use hex;
use r2d2;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::params;
use rusqlite::types::ToSql;
use rusqlite::OpenFlags;
use std::collections::HashMap;
use std::fmt::Write as _;
use std::path::{Path, PathBuf};
use std::thread;
use std::time::Duration;
use std::time::Instant;

use tokio::task;
use tracing::{debug, info, trace, warn};

pub type SqlitePool = r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>;
pub type PooledConnection = r2d2::PooledConnection<r2d2_sqlite::SqliteConnectionManager>;

/// Events submitted from a client, with a return channel for notices

/// Database file
pub const DB_FILE: &str = "nostr.db";
/// How many persisted events before optimization is triggered
pub const EVENT_COUNT_OPTIMIZE_TRIGGER: usize = 500;
/// How many persisted events before we pause for backups
pub const EVENT_COUNT_BACKUP_PAUSE_TRIGGER: usize = 1000;

const POSTR_DATA_DIR: &str = ".postr";

/// Build a database connection pool.
/// # Panics
///
/// Will panic if the pool could not be created.
#[must_use]
pub fn build_pool(
    name: &str,
    flags: OpenFlags,
    min_size: u32,
    max_size: u32,
    wait_for_db: bool,
) -> SqlitePool {
		let full_path = Path::new(&tauri::api::path::home_dir().unwrap())
			.join(POSTR_DATA_DIR)
			.join(DB_FILE);
    // small hack; if the database doesn't exist yet, that means the
    // writer thread hasn't finished.  Give it a chance to work.  This
    // is only an issue with the first time we run.

    while !full_path.exists() && wait_for_db {
        debug!("Database reader pool is waiting on the database to be created...");
        thread::sleep(Duration::from_millis(500));
    }

    let manager = SqliteConnectionManager::file(&full_path)
        .with_flags(flags)
        .with_init(|c| c.execute_batch(STARTUP_SQL));

    let pool: SqlitePool = r2d2::Pool::builder()
        .test_on_check_out(true) // no noticeable performance hit
        .min_idle(Some(min_size))
        .max_size(max_size)
        .max_lifetime(Some(Duration::from_secs(60)))
        .build(manager)
        .unwrap();
    info!(
        "Built a connection pool {:?} (min={}, max={})",
        name, min_size, max_size
    );
    pool
}

/// Perform normal maintenance
pub fn optimize_db(conn: &mut PooledConnection) -> Result<()> {
    conn.execute_batch("PRAGMA optimize;")?;
    Ok(())
}

/// Spawn a database writer that persists events to the SQLite store.
pub async fn db_writer(
    mut event_rx: tokio::sync::mpsc::Receiver<Event>,
    bcast_tx: tokio::sync::broadcast::Sender<Event>,
    metadata_tx: tokio::sync::broadcast::Sender<Event>,
    mut shutdown: tokio::sync::broadcast::Receiver<()>,
) -> tokio::task::JoinHandle<Result<()>> {
    // are we performing NIP-05 checking?
    // are we requriing NIP-05 user verification?

    task::spawn_blocking(move || {
        let full_path = Path::new(&tauri::api::path::home_dir().unwrap())
            .join(POSTR_DATA_DIR)
            .join(DB_FILE);

        info!("Opening database {:?}", full_path);

        // create a connection pool
        let pool = build_pool(
            "event writer",
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_CREATE,
            1,
            2,
            false,
        );

        info!("opened database {:?} for writing", full_path);
        upgrade_db(&mut pool.get()?)?;

        loop {
            if shutdown.try_recv().is_ok() {
                info!("shutting down database writer");
                break;
            }

            info!("Getting next event");
            // call blocking read on channel
            let next_event = event_rx.blocking_recv();

            if next_event.is_none() {
                break;
            }

            let event = next_event.unwrap();

            let start = Instant::now();
            match write_event(&mut pool.get()?, &event) {
                Ok(updated) => {
                    if updated == 0 {
                        info!("ignoring duplicate or deleted event");
                    } else {
                        info!(
                            "persisted event: {:?} from: {:?} in: {:?}",
                            event.get_event_id_prefix(),
                            event.get_author_prefix(),
                            start.elapsed()
                        );

                        bcast_tx.send(event.clone()).ok();
                    }
                }
                Err(err) => {
                    warn!("event insert failed: {:?}", err);
                }
            }
        }
        info!("database connection closed");
        Ok(())
    })
}

/// Persist an event to the database, returning rows added.
pub fn write_event(conn: &mut PooledConnection, e: &Event) -> Result<usize> {
    // start transaction
    let tx = conn.transaction()?;
    // get relevant fields from event and convert to blobs.
    let id_blob = hex::decode(&e.id).ok();
    let pubkey_blob: Option<Vec<u8>> = hex::decode(&e.pubkey).ok();
    let delegator_blob: Option<Vec<u8>> = e.delegated_by.as_ref().and_then(|d| hex::decode(d).ok());
    let event_str = serde_json::to_string(&e).ok();

    // validate content is valid JSON if kind == 0. return Ok(0) if not.
    if e.kind == 0 {
        if let Err(err) = serde_json::from_str::<serde_json::Value>(&e.content) {
            warn!("invalid JSON in event: {:?}", err);
            tx.rollback().ok();
            return Ok(0);
        }
    }

    let seen_map = e
        .seen_by
        .iter()
        .map(|s| (s.to_string(), true))
        .collect::<HashMap<String, bool>>();
    let seen_map_str = serde_json::to_string(&seen_map).ok();

    // ignore if the event hash is a duplicate.
    let mut ins_count = tx.execute(
			"INSERT OR IGNORE INTO event (event_hash, created_at, kind, author, pubkey, delegated_by, raw_event, content, seen_by, first_seen, hidden) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, strftime('%s','now'), FALSE);",
			params![id_blob, e.created_at, e.kind, pubkey_blob, e.pubkey, delegator_blob, event_str, e.content, seen_map_str]
	)?;

    if ins_count == 0 {
        // update the seen_by field of the event.
        let update_count = tx.execute(
            r##"UPDATE event SET seen_by = json_patch(seen_by, ?1) WHERE event_hash = ?2;"##,
            params![seen_map_str, id_blob],
        )?;

        if update_count > 0 {
            tx.commit()?;
            return Ok(update_count);
        }

        // if the event was a duplicate, no need to insert event or
        // pubkey references.
        tx.rollback().ok();
        return Ok(ins_count);
    }
    // remember primary key of the event most recently inserted.
    let ev_id = tx.last_insert_rowid();
    // add all tags to the tag table
    for tag in e.tags.iter() {
        // ensure we have 2 values.
        if tag.len() >= 2 {
            let tagname = &tag[0];
            let tagval = &tag[1];
            // only single-char tags are searchable
            let tagchar_opt = single_char_tagname(tagname);
            match &tagchar_opt {
                Some(_) => {
                    // if tagvalue is lowercase hex;
                    if is_lower_hex(tagval) && (tagval.len() % 2 == 0) {
                        tx.execute(
				"INSERT OR IGNORE INTO tag (event_id, name, value_hex) VALUES (?1, ?2, ?3)",
				params![ev_id, &tagname, hex::decode(tagval).ok()],
		)?;
                    } else {
                        tx.execute(
                            "INSERT OR IGNORE INTO tag (event_id, name, value) VALUES (?1, ?2, ?3)",
                            params![ev_id, &tagname, &tagval],
                        )?;
                    }
                }
                None => {}
            }
        }
    }
    // if this event is replaceable update, hide every other replaceable
    // event with the same kind from the same author that was issued
    // earlier than this.
    if e.kind == 0 || e.kind == 3 || (e.kind >= 10000 && e.kind < 20000) {
        let update_count = tx.execute(
					"UPDATE event SET hidden=TRUE WHERE id!=? AND kind=? AND author=? AND created_at <= ? and hidden!=TRUE",
					params![ev_id, e.kind, hex::decode(&e.pubkey).ok(), e.created_at],
			)?;
        if update_count > 0 {
            info!(
                "hid {} older replaceable kind {} events for author: {:?}",
                update_count,
                e.kind,
                e.get_author_prefix()
            );
        }
    }
    // if this event is a deletion, hide the referenced events from the same author.
    if e.kind == 5 {
        let event_candidates = e.tag_values_by_name("e");
        // first parameter will be author
        let mut params: Vec<Box<dyn ToSql>> = vec![Box::new(hex::decode(&e.pubkey).ok())];
        event_candidates
            .iter()
            .filter(|x| is_hex(x) && x.len() == 64)
            .filter_map(|x| hex::decode(x).ok())
            .for_each(|x| params.push(Box::new(x)));
        let query = format!(
            "UPDATE event SET hidden=TRUE WHERE kind!=5 AND author=? AND event_hash IN ({})",
            repeat_vars(params.len() - 1)
        );
        let mut stmt = tx.prepare(&query)?;
        let update_count = stmt.execute(rusqlite::params_from_iter(params))?;
        info!(
            "hid {} deleted events for author {:?}",
            update_count,
            e.get_author_prefix()
        );
    } else {
        // check if a deletion has already been recorded for this event.
        // Only relevant for non-deletion events
        let del_count = tx.query_row(
		"SELECT e.id FROM event e LEFT JOIN tag t ON e.id=t.event_id WHERE e.author=? AND t.name='e' AND e.kind=5 AND t.value_hex=? LIMIT 1;",
		params![pubkey_blob, id_blob], |row| row.get::<usize, usize>(0));
        // check if a the query returned a result, meaning we should
        // hid the current event
        if del_count.ok().is_some() {
            // a deletion already existed, mark original event as hidden.
            info!(
                "hid event: {:?} due to existing deletion by author: {:?}",
                e.get_event_id_prefix(),
                e.get_author_prefix()
            );
            let _update_count =
                tx.execute("UPDATE event SET hidden=TRUE WHERE id=?", params![ev_id])?;
            // event was deleted, so let caller know nothing new
            // arrived, preventing this from being sent to active
            // subscriptions
            ins_count = 0;
        }
    }
    tx.commit()?;
    Ok(ins_count)
}

/// Create a dynamic SQL subquery and params from a subscription filter.
fn query_from_filter(f: &ReqFilter) -> (String, Vec<Box<dyn ToSql>>) {
    // build a dynamic SQL query.  all user-input is either an integer
    // (sqli-safe), or a string that is filtered to only contain
    // hexadecimal characters.  Strings that require escaping (tag
    // names/values) use parameters.

    // if the filter is malformed, don't return anything.
    if f.force_no_match {
        let empty_query = "SELECT e.raw_event, e.created_at FROM event e WHERE 1=0".to_owned();
        // query parameters for SQLite
        let empty_params: Vec<Box<dyn ToSql>> = vec![];
        return (empty_query, empty_params);
    }

    let mut query = "SELECT e.raw_event, e.created_at FROM event e".to_owned();
    // query parameters for SQLite
    let mut params: Vec<Box<dyn ToSql>> = vec![];

    // individual filter components (single conditions such as an author or event ID)
    let mut filter_components: Vec<String> = Vec::new();
    // Query for "authors", allowing prefix matches
    if let Some(authvec) = &f.authors {
        // take each author and convert to a hexsearch
        let mut auth_searches: Vec<String> = vec![];
        for auth in authvec {
            match hex_range(auth) {
                Some(HexSearch::Exact(ex)) => {
                    debug!("Exact author search: {:?}", ex);
                    auth_searches.push("author=? OR delegated_by=?".to_owned());
                    params.push(Box::new(ex.clone()));
                    params.push(Box::new(ex));
                }
                Some(HexSearch::Range(lower, upper)) => {
                    auth_searches.push(
                        "(author>? AND author<?) OR (delegated_by>? AND delegated_by<?)".to_owned(),
                    );
                    params.push(Box::new(lower.clone()));
                    params.push(Box::new(upper.clone()));
                    params.push(Box::new(lower));
                    params.push(Box::new(upper));
                }
                Some(HexSearch::LowerOnly(lower)) => {
                    auth_searches.push("author>? OR delegated_by>?".to_owned());
                    params.push(Box::new(lower.clone()));
                    params.push(Box::new(lower));
                }
                None => {
                    info!("Could not parse hex range from author {:?}", auth);
                }
            }
        }
        if !authvec.is_empty() {
            let authors_clause = format!("({})", auth_searches.join(" OR "));
            filter_components.push(authors_clause);
        } else {
            // if the authors list was empty, we should never return
            // any results.
            filter_components.push("false".to_owned());
        }
    }
    // Query for Kind
    if let Some(ks) = &f.kinds {
        // kind is number, no escaping needed
        let str_kinds: Vec<String> = ks.iter().map(|x| x.to_string()).collect();
        let kind_clause = format!("kind IN ({})", str_kinds.join(", "));
        filter_components.push(kind_clause);
    }
    // Query for event, allowing prefix matches
    if let Some(idvec) = &f.ids {
        // take each author and convert to a hexsearch
        let mut id_searches: Vec<String> = vec![];
        for id in idvec {
            match hex_range(id) {
                Some(HexSearch::Exact(ex)) => {
                    id_searches.push("event_hash=?".to_owned());
                    params.push(Box::new(ex));
                }
                Some(HexSearch::Range(lower, upper)) => {
                    id_searches.push("(event_hash>? AND event_hash<?)".to_owned());
                    params.push(Box::new(lower));
                    params.push(Box::new(upper));
                }
                Some(HexSearch::LowerOnly(lower)) => {
                    id_searches.push("event_hash>?".to_owned());
                    params.push(Box::new(lower));
                }
                None => {
                    info!("Could not parse hex range from id {:?}", id);
                }
            }
        }
        if !idvec.is_empty() {
            let id_clause = format!("({})", id_searches.join(" OR "));
            filter_components.push(id_clause);
        } else {
            // if the ids list was empty, we should never return
            // any results.
            filter_components.push("false".to_owned());
        }
    }
    // Query for tags
    if let Some(map) = &f.tags {
        for (key, val) in map.iter() {
            let mut str_vals: Vec<Box<dyn ToSql>> = vec![];
            let mut blob_vals: Vec<Box<dyn ToSql>> = vec![];
            for v in val {
                if (v.len() % 2 == 0) && is_lower_hex(v) {
                    if let Ok(h) = hex::decode(v) {
                        blob_vals.push(Box::new(h));
                    }
                } else {
                    str_vals.push(Box::new(v.to_owned()));
                }
            }
            // create clauses with "?" params for each tag value being searched
            let str_clause = format!("value IN ({})", repeat_vars(str_vals.len()));
            let blob_clause = format!("value_hex IN ({})", repeat_vars(blob_vals.len()));
            // find evidence of the target tag name/value existing for this event.
            let tag_clause = format!("e.id IN (SELECT e.id FROM event e LEFT JOIN tag t on e.id=t.event_id WHERE hidden!=TRUE and (name=? AND ({} OR {})))", str_clause, blob_clause);
            // add the tag name as the first parameter
            params.push(Box::new(key.to_string()));
            // add all tag values that are plain strings as params
            params.append(&mut str_vals);
            // add all tag values that are blobs as params
            params.append(&mut blob_vals);
            filter_components.push(tag_clause);
        }
    }
    // Query for timestamp
    if f.since.is_some() {
        let created_clause = format!("created_at > {}", f.since.unwrap());
        filter_components.push(created_clause);
    }
    // Query for timestamp
    if f.until.is_some() {
        let until_clause = format!("created_at < {}", f.until.unwrap());
        filter_components.push(until_clause);
    }
    // never display hidden events
    query.push_str(" WHERE hidden!=TRUE");
    // build filter component conditions
    if !filter_components.is_empty() {
        query.push_str(" AND ");
        query.push_str(&filter_components.join(" AND "));
    }
    // Apply per-filter limit to this subquery.
    // The use of a LIMIT implies a DESC order, to capture only the most recent events.
    if let Some(lim) = f.limit {
        let _ = write!(query, " ORDER BY e.created_at DESC LIMIT {}", lim);
    } else {
        query.push_str(" ORDER BY e.created_at ASC")
    }
    (query, params)
}


/// Produce a arbitrary list of '?' parameters.
fn repeat_vars(count: usize) -> String {
    if count == 0 {
        return "".to_owned();
    }
    let mut s = "?,".repeat(count);
    // Remove trailing comma
    s.pop();
    s
}

/// Create a dynamic SQL query string and params from a subscription.
pub fn query_from_sub(sub: &Subscription) -> (String, Vec<Box<dyn ToSql>>) {
    // build a dynamic SQL query for an entire subscription, based on
    // SQL subqueries for filters.
    let mut subqueries: Vec<String> = Vec::new();
    // subquery params
    let mut params: Vec<Box<dyn ToSql>> = vec![];
    // for every filter in the subscription, generate a subquery
    for f in sub.filters.iter() {
        let (f_subquery, mut f_params) = query_from_filter(f);
        subqueries.push(f_subquery);
        params.append(&mut f_params);
    }
    // encapsulate subqueries into select statements
    let subqueries_selects: Vec<String> = subqueries
        .iter()
        .map(|s| format!("SELECT distinct raw_event, created_at FROM ({})", s))
        .collect();
    let query: String = subqueries_selects.join(" UNION ");
    (query, params)
}
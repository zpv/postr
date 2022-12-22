use crate::error::{Error, Result};
use crate::event::{self, single_char_tagname, Event};
use crate::notice::Notice;
use crate::schema::{upgrade_db, STARTUP_SQL};
use crate::utils::{is_hex, is_lower_hex};
use hex;
use r2d2;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::params;
use rusqlite::types::ToSql;
use rusqlite::OpenFlags;
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

            info!("Gettingg next event");
            // call blocking read on channel
            let next_event = event_rx.blocking_recv();

            if next_event.is_none() {
                break;
            }

            let event = next_event.unwrap();
            info!("got event {:?}", event);

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
    // ignore if the event hash is a duplicate.
    let mut ins_count = tx.execute(
			"INSERT OR IGNORE INTO event (event_hash, created_at, kind, author, pubkey, delegated_by, raw_event, content, first_seen, hidden) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, strftime('%s','now'), FALSE);",
			params![id_blob, e.created_at, e.kind, pubkey_blob, e.pubkey, delegator_blob, event_str, e.content]
	)?;
    if ins_count == 0 {
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

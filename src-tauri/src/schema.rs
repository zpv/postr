//! Database schema and migrations
use crate::db::PooledConnection;
use crate::error::Result;
use const_format::formatcp;
use rusqlite::limits::Limit;
use rusqlite::params;
use rusqlite::Connection;
use std::cmp::Ordering;
use std::time::Instant;
use tracing::{debug, error, info};

/// Startup DB Pragmas
pub const STARTUP_SQL: &str = r##"
PRAGMA main.synchronous=NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA journal_size_limit=32768;
pragma mmap_size = 17179869184; -- cap mmap at 16GB
"##;

/// Latest database version
pub const DB_VERSION: usize = 1;

/// Schema definition
const INIT_SQL: &str = formatcp!(
    r##"
-- Database settings
PRAGMA encoding = "UTF-8";
PRAGMA journal_mode=WAL;
PRAGMA main.synchronous=NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA application_id = 1654008667;
PRAGMA user_version = {};

-- Event Table
CREATE TABLE IF NOT EXISTS event (
id INTEGER PRIMARY KEY,
event_hash BLOB NOT NULL, -- 4-byte hash
first_seen INTEGER NOT NULL, -- when the event was first seen (not authored!) (seconds since 1970)
created_at INTEGER NOT NULL, -- when the event was authored
author BLOB NOT NULL, -- author pubkey
pubkey TEXT NOT NULL,
delegated_by BLOB, -- delegator pubkey (NIP-26)
kind INTEGER NOT NULL, -- event kind
hidden INTEGER, -- relevant for queries
content TEXT NOT NULL, -- serialized json of content object
raw_event TEXT NOT NULL, -- serialized json of event object
seen_by TEXT NOT NULL -- serialized json array of relays that have seen this event
);

-- Event Indexes
CREATE UNIQUE INDEX IF NOT EXISTS event_hash_index ON event(event_hash);
CREATE INDEX IF NOT EXISTS author_index ON event(author);
CREATE INDEX IF NOT EXISTS created_at_index ON event(created_at);
CREATE INDEX IF NOT EXISTS delegated_by_index ON event(delegated_by);
CREATE INDEX IF NOT EXISTS king_index ON event(kind);
CREATE INDEX IF NOT EXISTS event_composite_index ON event(kind,created_at);

-- USERS VIEW
CREATE VIEW IF NOT EXISTS users AS
	SELECT pubkey,
		json_extract(content,'$.name') name,
		json_extract(content,'$.picture') picture,
		json_extract(content,'$.about') about,
		json_extract(content,'$.nip05') nip05,
		CASE (ROW_NUMBER() OVER (
				PARTITION BY author
				ORDER BY created_at DESC
			))
			WHEN 1 THEN 1
			ELSE 0
			END is_current,
		created_at,
		first_seen
	FROM event
	WHERE event.kind = 0;

-- Tag Table
-- Tag values are stored as either a BLOB (if they come in as a
-- hex-string), or TEXT otherwise.
-- This means that searches need to select the appropriate column.
CREATE TABLE IF NOT EXISTS tag (
id INTEGER PRIMARY KEY,
event_id INTEGER NOT NULL, -- an event ID that contains a tag.
name TEXT, -- the tag name ("p", "e", whatever)
value TEXT, -- the tag value, if not hex.
value_hex BLOB, -- the tag value, if it can be interpreted as a lowercase hex string.
FOREIGN KEY(event_id) REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS tag_val_index ON tag(value);
CREATE INDEX IF NOT EXISTS tag_val_hex_index ON tag(value_hex);
CREATE INDEX IF NOT EXISTS tag_composite_index ON tag(event_id,name,value_hex,value);
CREATE INDEX IF NOT EXISTS tag_name_eid_index ON tag(name,event_id,value_hex);

-- NIP-05 User Validation
CREATE TABLE IF NOT EXISTS user_verification (
id INTEGER PRIMARY KEY,
metadata_event INTEGER NOT NULL, -- the metadata event used for this validation.
name TEXT NOT NULL, -- the nip05 field value (user@domain).
verified_at INTEGER, -- timestamp this author/nip05 was most recently verified.
failed_at INTEGER, -- timestamp a verification attempt failed (host down).
failure_count INTEGER DEFAULT 0, -- number of consecutive failures.
FOREIGN KEY(metadata_event) REFERENCES event(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS user_verification_name_index ON user_verification(name);
CREATE INDEX IF NOT EXISTS user_verification_event_index ON user_verification(metadata_event);
"##,
    DB_VERSION
);

/// Determine the current application database schema version.
pub fn curr_db_version(conn: &mut Connection) -> Result<usize> {
    let query = "PRAGMA user_version;";
    let curr_version = conn.query_row(query, [], |row| row.get(0))?;
    Ok(curr_version)
}

fn mig_init(conn: &mut PooledConnection) -> Result<usize> {
    match conn.execute_batch(INIT_SQL) {
        Ok(()) => {
            info!(
                "database pragma/schema initialized to v{}, and ready",
                DB_VERSION
            );
        }
        Err(err) => {
            error!("update failed: {}", err);
            panic!("database could not be initialized");
        }
    }
    Ok(DB_VERSION)
}

/// Upgrade DB to latest version, and execute pragma settings
pub fn upgrade_db(conn: &mut PooledConnection) -> Result<()> {
    // check the version.
    let mut curr_version = curr_db_version(conn)?;
    info!("DB version = {:?}", curr_version);

    debug!(
        "SQLite max query parameters: {}",
        conn.limit(Limit::SQLITE_LIMIT_VARIABLE_NUMBER)
    );
    debug!(
        "SQLite max table/blob/text length: {} MB",
        (conn.limit(Limit::SQLITE_LIMIT_LENGTH) as f64 / (1024 * 1024) as f64).floor()
    );
    debug!(
        "SQLite max SQL length: {} MB",
        (conn.limit(Limit::SQLITE_LIMIT_SQL_LENGTH) as f64 / (1024 * 1024) as f64).floor()
    );

    match curr_version.cmp(&DB_VERSION) {
        // Database is new or not current
        Ordering::Less => {
            // initialize from scratch
            if curr_version == 0 {
                curr_version = mig_init(conn)?;
            }

            if curr_version == DB_VERSION {
                info!(
                    "All migration scripts completed successfully.  Welcome to v{}.",
                    DB_VERSION
                );
            }
        }
        // Database is current, all is good
        Ordering::Equal => {
            debug!("Database version was already current (v{})", DB_VERSION);
        }
        // Database is newer than what this code understands, abort
        Ordering::Greater => {
            panic!(
                "Database version is newer than supported by this executable (v{} > v{})",
                curr_version, DB_VERSION
            );
        }
    }

    // Setup PRAGMA
    conn.execute_batch(STARTUP_SQL)?;
    debug!("SQLite PRAGMA startup completed");
    Ok(())
}

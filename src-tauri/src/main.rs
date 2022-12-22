extern crate websocket;
extern crate tokio;

use postr::db::{self, SqlitePool};
use postr::event::Event;
use postr::socket;
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use serde::{Deserialize, Serialize};
use tokio::task;

use std::{env, thread};
use std::error::Error;
use std::path::Path;
use std::fs;

use websocket::{ClientBuilder, OwnedMessage, Message};
use tokio::runtime::Builder;
use tokio::sync::broadcast::{self, Receiver, Sender};
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tracing::*;

use console_subscriber::ConsoleLayer;

#[cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str, pool: tauri::State<SqlitePool>) -> String {
    if let Ok(conn) = pool.get() {
        // execute the query. Don't cache, since queries vary so much.
        // count number of events
        match conn.query_row::<u32,_,_>("SELECT COUNT(*) FROM event", [], |row| row.get(0)) {
            Ok(count) => {
                info!("count: {}", count);
                count.to_string()
            }
            Err(e) => {
                error!("error: {}", e);
                "0".to_string()
            }
        }
    } else {
        "0".to_string()
    }
}

#[derive(Debug, Serialize, Deserialize)]

struct UserProfile {
    pubkey: String,
    name: String,
    picture: String,
    about: String,
    nip05: String,
    is_current: bool,
    created_at: i64,
    first_seen: i64
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn user_profile(pubkey: &str, pool: tauri::State<SqlitePool>) -> Result<UserProfile, String> {
    // get user profile from pubkey
    if let Ok(conn) = pool.get() {
        let mut statement = conn.prepare("SELECT * FROM users WHERE pubkey = ?").unwrap();
        let mut users = statement.query_map([pubkey], |row| {
            Ok(
                UserProfile {
                    pubkey: row.get(0)?,
                    name: row.get(1)?,
                    picture: row.get(2)?,
                    about: row.get(3)?,
                    nip05: row.get(4)?,
                    is_current: row.get(5)?,
                    created_at: row.get(6)?,
                    first_seen: row.get(7)?
                }
            )
        }).unwrap();


        if let Some(user) = users.next() {
            Ok(user.unwrap())
        } else {
            Err("no user".to_string())
        }
    } else {
        Err("no user".to_string())
    }
}

pub fn init_app_config_path() {
    let home_dir = tauri::api::path::home_dir();
    match home_dir {
      Some(home_dir) => {
        let app_config = Path::new(&home_dir);
        let app_config = app_config.join(".postr");
  
        info!("{:?}", app_config);
        fs::create_dir_all(app_config).unwrap();
      }
      None => {
        info!("no ")
      }
    }
  
    println!("{:?}", env::current_dir());
    println!("{:?}", env::current_exe());
}

fn main() {
    // setup tracing
    let _trace_sub = tracing_subscriber::fmt::try_init();
    info!("Starting up from main");

    init_app_config_path();

    // runs connect() in a separate thread
    let rt = Builder::new_multi_thread()
        .enable_all()
        .thread_name("tokio-ws")
        // limit concurrent SQLite blocking threads
        .max_blocking_threads(4)
        .on_thread_start(|| {
            debug!("started new thread");
        })
        .on_thread_stop(|| {
            debug!("stopping thread");
        })
        .build()
        .unwrap();

    rt.block_on(async {
        // all client-submitted valid events are broadcast to every
        // other client on this channel.  This should be large enough
        // to accomodate slower readers (messages are dropped if
        // clients can not keep up).
        let (bcast_tx, _) = broadcast::channel::<Event>(16384);
        // validated events that need to be persisted are sent to the
        // database on via this channel.
        let (event_tx, event_rx) = mpsc::channel::<Event>(4096);
        // establish a channel for letting all threads now about a
        // requested server shutdown.
        let (invoke_shutdown, shutdown_listen) = broadcast::channel::<()>(1);
        // create a channel for sending any new metadata event.  These
        // will get processed relatively slowly (a potentially
        // multi-second blocking HTTP call) on a single thread, so we
        // buffer requests on the channel.  No harm in dropping events
        // here, since we are protecting against DoS.  This can make
        // it difficult to setup initial metadata in bulk, since
        // overwhelming this will drop events and won't register
        // metadata events.
        let (metadata_tx, metadata_rx) = broadcast::channel::<Event>(4096);
        // start the database writer thread.  Give it a channel for
        // writing events, and for publishing events that have been
        // written (to all connected clients).
        db::db_writer(
            event_rx,
            bcast_tx.clone(),
            metadata_tx.clone(),
            shutdown_listen,
        )
        .await;
        info!("db writer created");
        tokio::spawn(async move {
            socket::connect(event_tx).await;
        });

        let pool = db::build_pool(
            "client query",
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
            4,
            128,
            true,
        );

        tauri::Builder::default()
            .manage(pool)
            .invoke_handler(tauri::generate_handler![greet])
            .invoke_handler(tauri::generate_handler![user_profile])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    });


}


extern crate tokio;
extern crate websocket;

use postr::cmd::{
    get_pubkey, get_relays, send_dm, set_privkey, set_relays, set_user_info, sub_to_msg_events,
    unsub_from_msg_events, user_convos, user_dms, user_profile, user_profiles,
};
use postr::db::{self, SqlitePool};
use postr::event::Event;
use postr::socket::RelayPool;
use postr::state::{InnerState, PostrState};
use postr::{
    __cmd__get_pubkey, __cmd__get_relays, __cmd__send_dm, __cmd__set_privkey, __cmd__set_relays,
    __cmd__set_user_info, __cmd__sub_to_msg_events, __cmd__unsub_from_msg_events,
    __cmd__user_convos, __cmd__user_dms, __cmd__user_profile, socket, __cmd__user_profiles,
};
use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use serde::{Deserialize, Serialize};
use tokio::task;

use std::error::Error;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::{env, thread};

use std::sync::RwLock;
use tokio::runtime::Builder;
use tokio::sync::broadcast::{self, Receiver, Sender};
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tracing::*;
use websocket::{ClientBuilder, Message, OwnedMessage};

use tauri::Manager;

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
        match conn.query_row::<u32, _, _>("SELECT COUNT(*) FROM event", [], |row| row.get(0)) {
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

        let relays = vec![
            "wss://satstacker.cloud",
            "wss://relay.damus.io",
            "wss://nostr-pub.wellorder.net",
            "wss://nostr.onsats.org",
            "wss://nostr-relay.wlvs.space",
            "wss://nostr.bitcoiner.social",
            "wss://nostr.zebedee.cloud",
            "wss://relay.nostr.info",
            "wss://nostr-pub.semisol.dev",
            "wss://freedom-relay.herokuapp.com/ws",
        ];

        let relay_pool = Arc::new(Mutex::new(RelayPool::new(relays, event_tx)));

        let pool = db::build_pool(
            "client query",
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
            4,
            128,
            true,
        );

        tauri::Builder::default()
            .manage(pool)
            .manage(relay_pool)
            .manage(bcast_tx)
            .manage(PostrState(RwLock::new(InnerState {
                privkey: "".to_string(),
                pubkey: "".to_string(),
            })))
            .invoke_handler(tauri::generate_handler![
                set_privkey,
                user_profile,
                user_dms,
                user_convos,
                get_pubkey,
                sub_to_msg_events,
                unsub_from_msg_events,
                send_dm,
                set_user_info,
                get_relays,
                set_relays,
                user_profiles
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    });
}

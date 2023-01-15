extern crate tokio;
extern crate websocket;

use postr::cmd::{
    fetch, get_privkey, get_pubkey, get_relays, send_dm, set_privkey, set_relays, set_user_info,
    sub_to_msg_events, unsub_from_msg_events, user_convos, user_dms, user_profile, user_profiles,
    verify_nip05,
};
use postr::event::Event;
use postr::socket::RelayPool;
use postr::state::{InnerState, PostrState};
use postr::{
    __cmd__fetch, __cmd__get_privkey, __cmd__get_pubkey, __cmd__get_relays, __cmd__send_dm,
    __cmd__set_privkey, __cmd__set_relays, __cmd__set_user_info, __cmd__sub_to_msg_events,
    __cmd__unsub_from_msg_events, __cmd__user_convos, __cmd__user_dms, __cmd__user_profile,
    __cmd__user_profiles, __cmd__verify_nip05, db,
};
use rusqlite::OpenFlags;
use std::sync::atomic::Ordering;

use std::env;
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};

use std::sync::RwLock;
use tokio::runtime::Builder;
use tokio::sync::broadcast;
use tokio::sync::mpsc;
use tracing::*;

#[cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

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
            info!("No home directory found.")
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
        .thread_name_fn(|| {
            // give each thread a unique numeric name
            static ATOMIC_ID: std::sync::atomic::AtomicUsize =
                std::sync::atomic::AtomicUsize::new(0);
            let id = ATOMIC_ID.fetch_add(1, Ordering::SeqCst);
            format!("tokio-ws-{}", id)
        })
        // limit concurrent SQLite blocking threads
        .max_blocking_threads(4)
        .on_thread_start(|| {
            trace!("started new thread: {:?}", std::thread::current().name());
        })
        .on_thread_stop(|| {
            trace!("stopped thread: {:?}", std::thread::current().name());
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
        // establish a channel for shutting down threads.
        let (shutdown_tx, _) = broadcast::channel::<()>(1);
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
        ];

        let relay_pool = Arc::new(Mutex::new(RelayPool::new(relays, event_tx)));

        let pool = db::build_pool(
            "client query",
            OpenFlags::SQLITE_OPEN_READ_ONLY,
            4,
            128,
            true,
        );

        // optimize db on startup
        if let Ok(mut conn) = pool.get() {
            info!("running database optimizer");
            db::optimize_db(&mut conn).ok();
        }

        tauri::Builder::default()
            .manage(pool)
            .manage(relay_pool)
            .manage(bcast_tx)
            .manage(shutdown_tx)
            .manage(PostrState(RwLock::new(InnerState {
                privkey: "".to_string(),
                pubkey: "".to_string(),
            })))
            .invoke_handler(tauri::generate_handler![
                set_privkey,
                get_privkey,
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
                user_profiles,
                fetch,
                verify_nip05
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    });
}

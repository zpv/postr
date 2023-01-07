use std::collections::HashMap;
use std::collections::HashSet;
use std::rc::Rc;
use std::str::FromStr;
use std::sync::Arc;
use std::sync::Mutex;
use std::time::Instant;

use crate::db::query_from_sub;
use crate::db::SqlitePool;
use crate::event::Event;
use crate::socket::RelayPool;
use crate::state::PostrState;
use crate::subscription::Req;
use crate::subscription::ReqFilter;
use crate::subscription::Subscription;
use reqwest;
use nostr_rust::events::EventPrepare;
use nostr_rust::nips::nip4::decrypt;
use nostr_rust::nips::nip4::encrypt;
use nostr_rust::utils::get_timestamp;
use nostr_rust::Identity;
use rusqlite::named_params;
use rusqlite::params;
use rusqlite::types::Value;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::command;
use tauri::Manager;
use tokio::sync::broadcast;
use tracing::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pubkey: String,
    name: Option<String>,
    picture: Option<String>,
    about: Option<String>,
    nip05: Option<String>,
    is_current: bool,
    created_at: i64,
    first_seen: i64,
}

#[command]
pub fn set_privkey(privkey: &str, state: tauri::State<PostrState>) -> Result<(), String> {
    let mut state = state.0.write().unwrap();

    // verify privkey is valid
    let identity = match Identity::from_str(privkey) {
        Ok(identity) => identity,
        Err(e) => {
            return Err(format!("Invalid private key: {}", e));
        }
    };
    state.privkey = privkey.to_string();
    state.pubkey = identity.public_key_str;

    Ok(())
}

#[command]
pub fn get_privkey(state: tauri::State<PostrState>) -> Result<String, String> {
    let state = state.0.read().unwrap();
    Ok(state.privkey.clone())
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[command]
pub fn user_profile(
    pubkey: &str,
    db_pool: tauri::State<SqlitePool>,
    relay_pool: tauri::State<Arc<Mutex<RelayPool>>>,
) -> Result<UserProfile, String> {
    let filters = vec![ReqFilter {
        ids: None,
        kinds: Some([0].to_vec()),
        since: None,
        until: None,
        authors: Some([pubkey.to_string()].to_vec()),
        limit: Some(1),
        tags: None,
        force_no_match: false,
    }];

    let req = Req::new(None, filters);
    // debug!("req: {:?}", req.to_string());
    relay_pool.lock().unwrap().send(req.to_string());

    // get user profile from pubkey
    if let Ok(conn) = db_pool.get() {
        let mut statement = conn
            .prepare_cached("SELECT * FROM users WHERE pubkey = ? AND is_current")
            .unwrap();
        let mut users = statement
            .query_map([pubkey], |row| {
                Ok(UserProfile {
                    pubkey: row.get(0)?,
                    name: row.get(1)?,
                    picture: row.get(2)?,
                    about: row.get(3)?,
                    nip05: row.get(4)?,
                    is_current: row.get(5)?,
                    created_at: row.get(6)?,
                    first_seen: row.get(7)?,
                })
            })
            .unwrap();

        if let Some(user) = users.next() {
            Ok(user.unwrap())
        } else {
            Err("no user".to_string())
        }
    } else {
        Err("no user".to_string())
    }
}

#[command]
pub fn user_profiles(
    pubkeys: Vec<String>,
    db_pool: tauri::State<SqlitePool>,
    relay_pool: tauri::State<Arc<Mutex<RelayPool>>>,
) -> Result<Vec<UserProfile>, String> {


    let subscription = Subscription {
        id: "idk".to_string(),
        // create a filter for each pubkey
        filters: pubkeys
            .iter()
            .map(|pubkey| ReqFilter {
                ids: None,
                kinds: Some([0].to_vec()),
                since: None,
                until: None,
                authors: Some([pubkey.to_string()].to_vec()),
                limit: Some(1),
                tags: None,
                force_no_match: false,
            })
            .collect(),
    };

    let req = Req::new(Some("user_profiles"), subscription.filters);
    relay_pool.lock().unwrap().send(req.to_string());
    let values: Rc<Vec<Value>> = Rc::new(pubkeys.into_iter().map(Value::from).collect());

    if let Ok(conn) = db_pool.get() {
        let mut statement = conn
            .prepare_cached("SELECT * FROM users WHERE pubkey in rarray(?) AND is_current")
            .unwrap();
        let mut users = statement
            .query_map(params![values], |row| {
                Ok(UserProfile {
                    pubkey: row.get(0)?,
                    name: row.get(1)?,
                    picture: row.get(2)?,
                    about: row.get(3)?,
                    nip05: row.get(4)?,
                    is_current: row.get(5)?,
                    created_at: row.get(6)?,
                    first_seen: row.get(7)?,
                })
            })
            .unwrap();

        let mut user_profiles = Vec::new();
        while let Some(user) = users.next() {
            user_profiles.push(user.unwrap());
        }

        Ok(user_profiles)
    } else {
        Err ("no user".to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]

pub struct UserConvo {
    pub peer: String,
    pub last_message: i64,
}

#[command]
pub fn user_convos(
    db_pool: tauri::State<SqlitePool>,
    relay_pool: tauri::State<Arc<Mutex<RelayPool>>>,
    state: tauri::State<PostrState>,
) -> Result<Vec<UserConvo>, String> {
    let privkey = state.0.read().unwrap().privkey.clone();
    let identity = Identity::from_str(&privkey).unwrap();

    let filters = vec![
        ReqFilter {
            ids: None,
            kinds: Some([4].to_vec()),
            since: None,
            until: None,
            authors: Some([identity.public_key_str.clone()].to_vec()),
            limit: Some(100),
            tags: None,
            force_no_match: false,
        },
        ReqFilter {
            ids: None,
            kinds: Some([4].to_vec()),
            since: None,
            until: None,
            authors: None,
            limit: Some(100),
            tags: Some(HashMap::from([(
                'p',
                HashSet::from([identity.public_key_str.clone()]),
            )])),
            force_no_match: false,
        },
    ];

    let req = Req::new(Some("convos"), filters);
    // debug!("req: {:?}", req.to_string());
    relay_pool.lock().unwrap().send(req.to_string());

    info!("Invoked user_convos with {:?}", identity.public_key_str);
    if let Ok(conn) = db_pool.get() {
        let start = Instant::now();
        let mut statement = conn
            .prepare_cached(
                r##"
        SELECT 
            CASE 
                WHEN t.value_hex = :current_user THEN author 
                ELSE t.value_hex 
            END AS peer,
            MAX(created_at) last_message
        FROM event e
            LEFT JOIN tag t ON e.id = t.event_id
            WHERE kind = 4 
                AND t.name = 'p' 
                AND (t.value_hex = :current_user OR author = :current_user)
        GROUP BY peer
    
        "##,
            )
            .unwrap();

        let h = hex::decode(identity.public_key_str).unwrap();
        let params = named_params! { ":current_user": Box::new(h.clone())};

        let mut users = statement
            .query_map(params, |row| {
                let peer_pubkey: Vec<u8> = row.get(0)?;
                let last_message: i64 = row.get(1)?;

                let peer_pubkey_str = hex::encode(peer_pubkey);

                Ok(UserConvo {
                    peer: peer_pubkey_str,
                    last_message: last_message,
                })
            })
            .unwrap();

        let mut result = Vec::new();
        while let Some(event) = users.next() {
            result.push(event.unwrap());
        }

        result.sort_by(|a, b| b.last_message.cmp(&a.last_message));

        // debug!("result: {:?}", result);
        info!("query ran in {:?}", start.elapsed());

        Ok(result)
    } else {
        Err("Failed to get db".to_string())
    }
}

#[command]
pub fn get_pubkey(state: tauri::State<'_, PostrState>) -> Result<String, String> {
    Ok(state.0.read().unwrap().pubkey.clone())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrivateMessageWithRecipient {
    pub id: String,
    pub author: String,
    pub content: String,
    pub timestamp: u64,
    pub recipient: String,
}

#[command]
pub fn user_dms(
    peer: &str,
    limit: Option<u64>,
    until: Option<u64>,
    db_pool: tauri::State<SqlitePool>,
    relay_pool: tauri::State<Arc<Mutex<RelayPool>>>,
    state: tauri::State<PostrState>,
) -> Result<Vec<PrivateMessageWithRecipient>, String> {
    let privkey = state.0.read().unwrap().privkey.clone();
    let identity = Identity::from_str(&privkey).unwrap();
    let x_pub_key: secp256k1::XOnlyPublicKey = match secp256k1::XOnlyPublicKey::from_str(peer) {
        Ok(x) => x,
        Err(e) => {
            return Err(format!("Invalid pubkey: {}", e));
        }
    };    


    let subscription = Subscription {
        id: "idk".to_string(),
        filters: vec![
            ReqFilter {
                ids: None,
                kinds: Some([4].to_vec()),
                since: None,
                until: match until {
                    Some(u) => Some(u),
                    None => None,
                },
                authors: Some([identity.public_key_str.clone()].to_vec()),
                limit: match limit {
                    Some(l) => Some(l),
                    None => Some(100),
                },
                tags: Some(HashMap::from([(
                    'p',
                    HashSet::from([x_pub_key.to_string()]),
                )])),
                force_no_match: false,
            },
            ReqFilter {
                ids: None,
                kinds: Some([4].to_vec()),
                since: None,
                until: match until {
                    Some(u) => Some(u),
                    None => None,
                },
                authors: Some([x_pub_key.to_string()].to_vec()),
                limit: match limit {
                    Some(l) => Some(l),
                    None => Some(100),
                },
                tags: Some(HashMap::from([(
                    'p',
                    HashSet::from([identity.public_key_str.clone()]),
                )])),
                force_no_match: false,
            },
        ],
    };

    let req = Req::new(Some(&format!("{}-dms", peer)), subscription.clone().filters);
    // debug!("req: {:?}", req.to_string());
    relay_pool.lock().unwrap().send(req.to_string());

    let (q, p) = query_from_sub(&subscription);
    // debug!("query: {}", q);

    if let Ok(conn) = db_pool.get() {
        let mut statement = conn.prepare_cached(&q).unwrap();

        let mut events = statement
            .query_map(rusqlite::params_from_iter(p), |row| {
                let msg: String = row.get(0)?;
                let event: Event = serde_json::from_str(&msg).unwrap();
                let created_at: i64 = row.get(1)?;
                

                let decrypted_message =
                    match decrypt(&identity.secret_key, &x_pub_key, &event.content) {
                        Ok(message) => message,
                        Err(e) => {
                            error!("decryption error: {}", e);
                            return Err(rusqlite::Error::InvalidQuery);
                        }
                    };

                // deserialize the message as event
                // debug!("event: {:?}", decrypted_message);

                // if event.pubkey is our pubkey, then the recipient is the peer
                let recipient = if event.pubkey == identity.public_key_str {
                    x_pub_key.to_string()
                } else {
                    identity.public_key_str.clone()
                };

                let private_message = PrivateMessageWithRecipient {
                    id: event.id.clone(),
                    author: event.pubkey,
                    content: decrypted_message,
                    recipient,
                    timestamp: created_at as u64,
                };

                Ok(private_message)
            })
            .unwrap();

        let mut result = Vec::new();
        while let Some(event) = events.next() {
            result.push(event.unwrap());
        }

        // debug!("result: {:?}", result);
        result.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        result = result
            .into_iter()
            .take(limit.unwrap_or(100) as usize)
            .rev()
            .collect::<Vec<PrivateMessageWithRecipient>>();

        Ok(result)
    } else {
        Err("no user".to_string())
    }
}

#[command]
pub async fn sub_to_msg_events(
    bcast_tx: tauri::State<'_, broadcast::Sender<Event>>,
    state: tauri::State<'_, PostrState>,
    app_handle: tauri::AppHandle,
) -> Result<(), ()> {
    let privkey = state.0.read().unwrap().privkey.clone();
    let identity = Identity::from_str(&privkey).unwrap();
    let mut bcast_rx = bcast_tx.subscribe();

    let sub_filter = Subscription {
        id: "dms".to_string(),
        filters: vec![
            ReqFilter {
                ids: None,
                kinds: Some([4].to_vec()),
                since: None,
                until: None,
                authors: Some([identity.public_key_str.clone()].to_vec()),
                limit: Some(100),
                tags: None,
                force_no_match: false,
            },
            ReqFilter {
                ids: None,
                kinds: Some([4].to_vec()),
                since: None,
                until: None,
                authors: None,
                limit: Some(100),
                tags: Some(HashMap::from([(
                    'p',
                    HashSet::from([identity.public_key_str.clone()]),
                )])),
                force_no_match: false,
            },
        ],
    };

    while let Ok(event) = &bcast_rx.recv().await {
        // debug!("event: {:?}", event);

        // if event string is "stop subscription", then stop the subscription
        if event.content == "stop subscription" {
            // debug!("stopping subscription");
            break;
        }

        if sub_filter.interested_in_event(event) {
            // peer is the other user in the convo. if author is us, then peer is the tag value
            let peer = if event.pubkey == identity.public_key_str {
                event.tags.get(0).unwrap().get(1).unwrap().clone()
            } else {
                event.pubkey.clone()
            };

            let x_pub_key = secp256k1::XOnlyPublicKey::from_str(&peer).unwrap();

            let decrypted_message = match decrypt(&identity.secret_key, &x_pub_key, &event.content)
            {
                Ok(message) => message,
                Err(e) => {
                    error!("decryption error: {}", e);
                    return Err(());
                }
            };

            // deserialize the message as event
            // debug!("event: {:?}", decrypted_message);
            let recipient = if event.pubkey == identity.public_key_str {
                x_pub_key.to_string()
            } else {
                identity.public_key_str.clone()
            };

            let private_message = PrivateMessageWithRecipient {
                id: event.id.clone(),
                author: event.pubkey.clone(),
                content: decrypted_message,
                recipient,
                timestamp: event.created_at as u64,
            };

            app_handle.emit_all("dm", private_message).unwrap();

            // debug!("matches");
        }
    }

    Ok(())
}

#[command]
pub async fn fetch(
    url: String,
) -> Result<serde_json::Value, String> {
    // call map_err to convert the error to a string
    let resp = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    let json = resp.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    Ok(json)
}

#[command]
pub async fn unsub_from_msg_events(
    bcast_tx: tauri::State<'_, broadcast::Sender<Event>>,
) -> Result<(), ()> {
    bcast_tx
        .send(Event {
            content: "stop subscription".to_string(),
            ..Default::default()
        })
        .unwrap();
    Ok(())
}

#[command]
pub fn send_dm(
    peer: &str,
    message: &str,
    relay_pool: tauri::State<Arc<Mutex<RelayPool>>>,
    state: tauri::State<PostrState>,
) -> Result<(), ()> {
    let privkey = state.0.read().unwrap().privkey.clone();
    let identity = Identity::from_str(&privkey).unwrap();

    let x_pub_key = match secp256k1::XOnlyPublicKey::from_str(peer) {
        Ok(x_pub_key) => x_pub_key,
        Err(e) => {
            error!("send_dm: Invalid pubkey: {}", e);
            return Err(());
        }
    };
    let encrypted_message = encrypt(&identity.secret_key, &x_pub_key, message).unwrap();

    let event = EventPrepare {
        pub_key: identity.public_key_str.clone(),
        created_at: get_timestamp(),
        kind: 4,
        tags: vec![vec!["p".to_string(), peer.to_string()]],
        content: encrypted_message,
    }
    .to_event(&identity, 0);

    let json_stringified = json!(["EVENT", event]).to_string();

    relay_pool.lock().unwrap().send(json_stringified);

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfileUpdate {
    name: Option<String>,
    picture: Option<String>,
    about: Option<String>,
    nip05: Option<String>,
}

#[command]
pub fn set_user_info(
    name: Option<String>,
    about: Option<String>,
    nip05: Option<String>,
    picture: Option<String>,
    relay_pool: tauri::State<Arc<Mutex<RelayPool>>>,
    state: tauri::State<PostrState>,
) -> Result<(), ()> {
    let privkey = state.0.read().unwrap().privkey.clone();
    let identity = Identity::from_str(&privkey).unwrap();

    let user_profile_update = UserProfileUpdate {
        name,
        picture,
        about,
        nip05,
    };

    // serialize user profile update to json
    let content = json!(user_profile_update).to_string();

    let event = EventPrepare {
        pub_key: identity.public_key_str.clone(),
        created_at: get_timestamp(),
        kind: 0,
        tags: vec![],
        content,
    }
    .to_event(&identity, 0);

    let json_stringified = json!(["EVENT", event]).to_string();

    relay_pool.lock().unwrap().send(json_stringified);
    Ok(())
}

#[command]
pub fn get_relays(relay_pool: tauri::State<Arc<Mutex<RelayPool>>>) -> Result<Vec<String>, ()> {
    let relays = relay_pool.lock().unwrap().get_relays();
    Ok(relays)
}

#[command]
pub fn set_relays(
    relays: Vec<&str>,
    relay_pool: tauri::State<Arc<Mutex<RelayPool>>>,
) -> Result<(), ()> {
    relay_pool.lock().unwrap().set_relays(relays);
    Ok(())
}
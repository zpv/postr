
use std::collections::HashMap;
use std::collections::HashSet;
use std::str::FromStr;
use std::sync::Arc;
use std::sync::Mutex;

use nostr_rust::Identity;
use nostr_rust::nips::nip4::PrivateMessage;
use nostr_rust::nips::nip4::decrypt;
use rusqlite::ToSql;
use crate::db::SqlitePool;
use crate::db::query_from_sub;
use crate::event::Event;
use crate::socket::RelayPool;
use crate::subscription::Req;
use crate::subscription::ReqFilter;
use serde::{Deserialize, Serialize};
use crate::subscription::Subscription;
use tauri::command;
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
    first_seen: i64
}


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[command]
pub fn user_profile(pubkey: &str, pool: tauri::State<SqlitePool>, relay_pool: tauri::State<Arc<Mutex<RelayPool>>>) -> Result<UserProfile, String> {
    let filters = vec![
            ReqFilter { 
                ids: None,
                kinds: Some([0].to_vec()),
                since: None,
                until: None,
                authors: Some([pubkey.to_string()].to_vec()),
                limit: Some(100),
                tags: None,
                force_no_match: false,
            }
        ];
    
    let req = Req::new(None, filters);
    debug!("req: {:?}", req.to_string());
    relay_pool.lock().unwrap().send(req.to_string());

    // get user profile from pubkey
    if let Ok(conn) = pool.get() {
        let mut statement = conn.prepare("SELECT * FROM users WHERE pubkey = ? AND is_current").unwrap();
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

#[command]
pub fn user_dms(peer: &str, privkey: &str, pool: tauri::State<SqlitePool>, relay_pool: tauri::State<Arc<Mutex<RelayPool>>> ) -> Result<Vec<PrivateMessage>, String> {
    let identity = Identity::from_str(privkey).unwrap();
    let x_pub_key = secp256k1::XOnlyPublicKey::from_str(peer).unwrap();

    let subscription = Subscription {
        id: "idk".to_string(),
        filters: vec![
            ReqFilter { 
                ids: None,
                kinds: Some([4].to_vec()),
                since: None,
                until: None,
                authors: Some([identity.public_key_str.clone()].to_vec()),
                limit: Some(100),
                tags: Some(
                    HashMap::from([('p', HashSet::from([x_pub_key.to_string()]))])
                ),
                force_no_match: false,
            }
            ,
            ReqFilter { 
                ids: None,
                kinds: Some([4].to_vec()),
                since: None,
                until: None,
                authors: Some([x_pub_key.to_string()].to_vec()),
                limit: Some(100),
                tags: Some(
                    HashMap::from([('p', HashSet::from([identity.public_key_str.clone()]))])
                ),
                force_no_match: false,
            },
        ],
    };

    let req = Req::new(None, subscription.clone().filters);
    debug!("req: {:?}", req.to_string());
    relay_pool.lock().unwrap().send(req.to_string());

    let (q, p) = query_from_sub(&subscription);
    debug!("query: {}", q);

    if let Ok(conn) = pool.get() {
        let mut statement = conn.prepare(&q).unwrap();

        let mut events = statement.query_map(rusqlite::params_from_iter(p), |row| {
            let msg: String = row.get(0)?;
            let event: Event = serde_json::from_str(&msg).unwrap();

            let created_at: i64 = row.get(1)?;
        
            let decrypted_message = match decrypt(&identity.secret_key, &x_pub_key, &event.content)
            {
                Ok(message) => message,
                Err(e) => {
                    error!("decryption error: {}", e);
                    return Err(rusqlite::Error::InvalidQuery);
                }
            };

            // deserialize the message as event
            debug!("event: {:?}", decrypted_message);


            let private_message = PrivateMessage {
                author: event.pubkey,
                content: decrypted_message,
                timestamp: created_at as u64,
            };

            Ok(private_message)

        }).unwrap();


        let mut result = Vec::new();
        while let Some(event) = events.next() {
            result.push(event.unwrap());
        }

        debug!("result: {:?}", result);
        result.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));
        Ok(result)
    } else {
        Err("no user".to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]

pub struct UserConvo {
    pub peer: String,
    pub last_message: i64
}

#[command]
pub fn user_convos(privkey: &str, pool: tauri::State<SqlitePool>, relay_pool: tauri::State<Arc<Mutex<RelayPool>>> ) -> Result<Vec<UserConvo>, String> {
    let identity = Identity::from_str(privkey).unwrap();

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
            }
            ,
            ReqFilter { 
                ids: None,
                kinds: Some([4].to_vec()),
                since: None,
                until: None,
                authors: None,
                limit: Some(100),
                tags: Some(
                    HashMap::from([('p', HashSet::from([identity.public_key_str.clone()]))])
                ),
                force_no_match: false,
            },
        ];
    
    let req = Req::new(None, filters);
    debug!("req: {:?}", req.to_string());
    relay_pool.lock().unwrap().send(req.to_string());

    debug!("Invoked user_convos with {:?}", identity.public_key_str);
    if let Ok(conn) = pool.get() {
        let mut statement = conn.prepare(r##"
        SELECT peer, MAX(last_message) last_message
        FROM (
          SELECT author AS peer,
            MAX(created_at) last_message
          FROM event e
            LEFT JOIN tag t ON e.id = t.event_id
            WHERE kind = 4 AND t.name = 'p' AND t.value_hex = ?
          GROUP BY t.value_hex, author

          UNION ALL

          SELECT t.value_hex AS peer,
            MAX(created_at) last_message
          FROM event e
            LEFT JOIN tag t ON e.id = t.event_id
          WHERE kind = 4
            AND t.name = 'p'
            AND author = ?
          GROUP BY t.value_hex, author
        )
        GROUP BY peer
        "##).unwrap();

        let mut params: Vec<Box<dyn ToSql>> = vec![];        

        if let Ok(h) = hex::decode(identity.public_key_str) {
            params.push(Box::new(h.clone()));
            params.push(Box::new(h));
        }

        let mut users = statement.query_map(rusqlite::params_from_iter(params), |row| {
            let peer_pubkey: Vec<u8> = row.get(0)?;
            let last_message: i64 = row.get(1)?;

            let peer_pubkey_str = hex::encode(peer_pubkey);

            Ok(UserConvo {
                peer: peer_pubkey_str,
                last_message: last_message,
            })
        }).unwrap();

        let mut result = Vec::new();
        while let Some(event) = users.next() {
            result.push(event.unwrap());
        }

        result.sort_by(|a, b| b.last_message.cmp(&a.last_message));

        debug!("result: {:?}", result);

        Ok(result)
    } else {
        Err("Failed to get db".to_string())
    }
}

#[command]
pub fn to_pubkey(privkey: &str) -> Result<String, String> {
    let identity = Identity::from_str(privkey).unwrap();
    Ok(identity.public_key_str)
}

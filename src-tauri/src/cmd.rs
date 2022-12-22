
use std::collections::HashMap;
use std::collections::HashSet;
use std::str::FromStr;

use nostr_rust::Identity;
use nostr_rust::nips::nip4::PrivateMessage;
use nostr_rust::nips::nip4::decrypt;
use crate::db::SqlitePool;
use crate::db::query_from_sub;
use crate::event::Event;
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
pub fn user_profile(pubkey: &str, pool: tauri::State<SqlitePool>) -> Result<UserProfile, String> {
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
pub fn user_dms(peer: &str, privkey: &str, pool: tauri::State<SqlitePool>) -> Result<Vec<PrivateMessage>, String> {
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
                limit: None,
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
                limit: None,
                tags: Some(
                    HashMap::from([('p', HashSet::from([identity.public_key_str.clone()]))])
                ),
                force_no_match: false,
            },
        ],
    };

    let (q, p) = query_from_sub(&subscription);
    debug!("query: {}", q);

    if let Ok(conn) = pool.get() {
        let mut statement = conn.prepare(&q).unwrap();

        let mut events = statement.query_map(rusqlite::params_from_iter(p), |row| {
            error!("row!!!");
            let msg: String = row.get(0)?;
            let event: Event = serde_json::from_str(&msg).unwrap();

            debug!("contents: {}", event.content);
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


#[command]
pub fn to_pubkey(privkey: &str) -> Result<String, String> {
    let identity = Identity::from_str(privkey).unwrap();
    Ok(identity.public_key_str)
}

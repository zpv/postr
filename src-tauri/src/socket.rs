extern crate tokio;
extern crate websocket;

use crate::db;
use futures_util::{SinkExt, StreamExt};
use tokio::join;
use tokio_tungstenite::tungstenite::Message;
use crate::error::{Error, Result};
use crate::event::Event;
use crate::event::EventResp;

use std::collections::{hash_set, HashSet};
use std::env;
use std::fs;
use std::path::Path;
use std::time::Duration;

use tokio::runtime::Builder;
use tokio::sync::broadcast::{self, Receiver, Sender};
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tokio_tungstenite::{
    connect_async,
    tungstenite::{Error as TungsteniteError, Result as TungsteniteResult},
};
use tracing::*;
use url::Url;

use console_subscriber::ConsoleLayer;
use serde::{Deserialize, Serialize};
use serde_json::json;

/// Close command in network format
#[derive(Serialize, Deserialize, PartialEq, Eq, Debug, Clone)]
pub struct EOSE {
    /// Protocol command, expected to always be "EOSE".
    cmd: String,
    /// The subscription identifier.
    id: String,
}

/// Nostr protocol messages from a client
#[derive(Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
#[serde(untagged)]
pub enum NostrMessage {
    /// An `EVENT` message
    EventMsg(EventResp),
    /// An `EOSE` message
    EOSEMsg(EOSE),
}

pub struct RelaySocket {
    relay: String,

    // The channel the socket will send events to
    event_tx: tokio::sync::mpsc::Sender<Event>,
}

pub struct RelayPool {
    broadcast_txs: Vec<broadcast::Sender<String>>,
}

impl RelayPool {
    // takes a vector of broadcast::Sender<String> and returns a RelayPool
    pub fn new(broadcast_txs: Vec<broadcast::Sender<String>>) -> Self {
        Self {
            broadcast_txs
        }
    }

    pub fn add(&mut self, tx: broadcast::Sender<String>) {
        self.broadcast_txs.push(tx);
    }

    pub fn send(&mut self, msg: String) {
        for tx in self.broadcast_txs.iter() {
            tx.send(msg.clone()).unwrap();
        }
    }
}

impl RelaySocket {
    pub fn new(relay: String, event_tx: tokio::sync::mpsc::Sender<Event>) -> Self {

        Self {
            relay,
            event_tx,
        }
    }

    pub fn connect(&mut self) -> broadcast::Sender<String> {
        let (tx, _) = broadcast::channel::<String>(32);

        let relay = self.relay.clone();
        let event_tx = self.event_tx.clone();

        let tx_clone = tx.clone();

        tokio::spawn(async move {
            loop {
                let tx_clone_2 = tx_clone.clone();
                let mut rx2 = tx_clone_2.subscribe();
                let url = Url::parse(&relay).unwrap();
                let (mut socket, _) = match connect_async(url).await {
                    Ok(s) => s,
                    Err(e) => {
                        error!("Error connecting to {}: {:?}", relay, e);
                        // wait 5 seconds before trying to reconnect
                        tokio::time::sleep(Duration::from_secs(5)).await;
                        continue;
                    }
                };

                // split socket
                let (mut write, mut read) = socket.split();
                let message = r#"["REQ", "cid", { "limit": 1 }]"#;
                write.send(message.into()).await.unwrap();

                // periodically send a ping to the server
                // let ping_handler = tokio::spawn(async move {
                //     loop {
                //         tokio::time::sleep(Duration::from_secs(1)).await;
                //         tx_close_2.send(message.into()).unwrap();
                //     }
                // });

                // Create a channel to send messages to the server
                let send_handler = tokio::spawn(async move {
                    while let Ok(msg) = &rx2.recv().await {
                        info!("Sending message: {:?}", msg);
                        let msg = Message::Text(msg.to_string());
                        write.send(msg).await.unwrap();
                    }
                });

                while let Some(msg) = read.next().await {
                    let msg = match msg {
                        Ok(msg) => msg,
                        Err(e) => {
                            error!("Error: {:?}", e);
                            break;
                        }
                    };

                    if msg.is_text() {
                        let msg = msg.into_text().unwrap();
                        let parsed_msg = convert_to_msg(msg, None);
        
                        match parsed_msg {
                            Ok(m) => {
                                match m {
                                    NostrMessage::EventMsg(ec) => {
                                        let parsed: Result<Event> = Result::<Event>::from(ec);
        
                                        match parsed {
                                            Ok(mut e) => {
                                                let id_prefix: String = e.id.chars().take(8).collect();
                                                e.seen_by = vec![relay.clone()];
                                                debug!(
                                                    "successfully parsed/validated event: {:?} relay: {:?}",
                                                    id_prefix, &relay
                                                );

                                                if let Err(_) = &event_tx.send(e.clone()).await {
                                                        error!("receiver dropped");
                                                        break;
                                                }
                                            }
                                            Err(e) => {
                                                error!("client sent an invalid event");
                                            }
                                        }
                                    }
                                    NostrMessage::EOSEMsg(eose) => {
                                        info!("received EOSE message from relay {:?}: {:?}", relay, eose);
                                        if eose.cmd != "EOSE" {
                                            error!("received EOSE message with invalid command: {:?}", eose.cmd);
                                            continue;
                                        }

                                        if eose.id == "cid" {
                                            continue;
                                        }

                                        info!("sending CLOSE {} message to relay: {:?}", eose.id, relay);

                                        tx_clone_2.send(json!(["CLOSE", eose.id]).to_string()).unwrap();
                                    },
                                }
                            }
                            Err(e) => {
                                error!("Error: {:?}", e);
                            }
                        }
                    }
                }
           
                send_handler.abort();
            }    
        });

        return tx
      }
}

/// Convert Message to NostrMessage
fn convert_to_msg(msg: String, max_bytes: Option<usize>) -> Result<NostrMessage> {
    let parsed_res: Result<NostrMessage> = serde_json::from_str(&msg).map_err(|e| e.into());
    match parsed_res {
        Ok(m) => {
            if let NostrMessage::EventMsg(_) = m {
                if let Some(max_size) = max_bytes {
                    // check length, ensure that some max size is set.
                    if msg.len() > max_size && max_size > 0 {
                        return Err(Error::EventMaxLengthError(msg.len()));
                    }
                }
            }
            Ok(m)
        }
        Err(e) => {
            debug!("proto parse error: {:?}", e);
            error!("parse error on message: {}", msg.trim());
            Err(Error::ProtoParseError)
        }
    }
}
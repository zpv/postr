extern crate tokio;
extern crate websocket;

use crate::db;
use crate::error::{Error, Result};
use crate::event::Event;
use crate::event::EventResp;
use futures_util::{SinkExt, StreamExt};
use tokio::join;
use tokio_tungstenite::tungstenite::Message;

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
    shutdown_tx: Option<broadcast::Sender<()>>,
}

pub struct RelayPool {
    broadcast_txs: Vec<broadcast::Sender<String>>,
    relay_sockets: Vec<RelaySocket>,
    event_tx: tokio::sync::mpsc::Sender<Event>,
}

impl RelayPool {
    pub fn new(relays: Vec<&str>, event_tx: tokio::sync::mpsc::Sender<Event>) -> Self {
        let mut relay_sockets = Vec::new();

        let broadcast_txs: Vec<Sender<String>> = relays
            .into_iter()
            .map(|relay| {
                let event_tx = event_tx.clone();
                let mut relay = RelaySocket::new(relay.to_string(), event_tx);
                let tx = relay.connect();
                relay_sockets.push(relay);
                tx
            })
            .collect();
        Self {
            broadcast_txs,
            relay_sockets,
            event_tx,
        }
    }

    pub fn add(&mut self, tx: broadcast::Sender<String>) {
        self.broadcast_txs.push(tx);
    }

    pub fn set_relays(&mut self, relays: Vec<&str>) {
        // stop current relays
        for relay in self.relay_sockets.iter() {
            info!("Sending shutdown relay {}", relay.get_relay());
            relay.shutdown();
        }

        let mut relay_sockets = Vec::new();
        let broadcast_txs: Vec<Sender<String>> = relays
            .into_iter()
            .map(|relay| {
                let event_tx = self.event_tx.clone();
                let mut relay = RelaySocket::new(relay.to_string(), event_tx);
                let tx = relay.connect();
                relay_sockets.push(relay);
                tx
            })
            .collect();
        self.broadcast_txs = broadcast_txs;
        self.relay_sockets = relay_sockets;
    }

    pub fn get_relays(&self) -> Vec<String> {
        let mut relays = Vec::new();
        for relay in self.relay_sockets.iter() {
            relays.push(relay.get_relay());
        }
        relays
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
            shutdown_tx: None,
        }
    }

    pub fn get_relay(&self) -> String {
        self.relay.clone()
    }

    pub fn connect(&mut self) -> broadcast::Sender<String> {
        let (tx, _) = broadcast::channel::<String>(32);
        let (invoke_shutdown, mut shutdown_listen) = broadcast::channel::<()>(1);
        self.shutdown_tx = Some(invoke_shutdown.clone());

        let relay = self.relay.clone();
        let event_tx = self.event_tx.clone();

        let tx_clone = tx.clone();

        let mut shutdown = false;

        let t = tokio::spawn(async move {
            loop {
                if shutdown {
                    info!("Shutting down relay {}", relay);
                    break;
                }
                // let tx_clone_2 = tx_clone.clone();
                // let mut rx2 = tx_clone_2.subscribe();
                let url = Url::parse(&relay).unwrap();
                let (socket, _) = match connect_async(url).await {
                    Ok(s) => {
                        info!("Connected to {}", relay);
                        s
                    }
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
                // let send_handler = tokio::spawn(async move {
                //     while let Ok(msg) = &rx2.recv().await {
                //         info!("Sending message: {:?}", msg);
                //         let msg = Message::Text(msg.to_string());
                //         write.send(msg).await.unwrap();
                //     }
                // });
                let mut rx = tx_clone.subscribe();
                // Listen to shutdown signal
                loop {
                    info!("Listening for next message on {}...", relay);
                    tokio::select! {
                        _ = shutdown_listen.recv() => {
                            shutdown = true;
                            break;
                        }
                        // send tx message to relay 
                        send_msg = rx.recv() => {
                            if let Ok(msg) = send_msg {
                                info!("Sending message to {:?}: {:?}", relay, msg);
                                let msg = Message::Text(msg.to_string());
                                write.send(msg).await.unwrap();
                            }
                        }
                        msg = read.next() => {

                            let msg = match msg {
                                Some(Ok(msg)) => msg,
                                Some(Err(e)) => {
                                    error!("Error: {:?}", e);
                                    break;
                                },
                                None => {
                                    error!("Connection closed");
                                    break;
                                }
                            };

                            if msg.is_text() {
                                let msg = msg.into_text().unwrap();
                                let parsed_msg = convert_to_msg(msg, None);

                                match parsed_msg {
                                    Ok(m) => match m {
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
                                            info!(
                                                "received EOSE message from relay {:?}: {:?}",
                                                relay, eose
                                            );
                                            if eose.cmd != "EOSE" {
                                                error!(
                                                    "received EOSE message with invalid command: {:?}",
                                                    eose.cmd
                                                );
                                                continue;
                                            }

                                            if eose.id == "cid" {
                                                continue;
                                            }

                                            info!(
                                                "sending CLOSE {} message to relay: {:?}",
                                                eose.id, relay
                                            );

                                            write
                                                // .send(json!(["CLOSE", eose.id]).to_string())
                                                .send(format!(r#"["CLOSE", "{}"]"#, eose.id).into()).await
                                                .unwrap(); 
                                        }
                                    },
                                    Err(e) => {
                                        error!("Error: {:?}", e);
                                    }
                                }
                            }
                        }
                    }
                }
                // send_handler.abort();
            }
        });

        return tx;
    }

    pub fn shutdown(&self) {
        if let Some(tx) = &self.shutdown_tx {
            tx.send(()).unwrap();
        }
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

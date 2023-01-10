extern crate tokio;
extern crate websocket;

use crate::cmd::verify_nip05;
use crate::error::{Error, Result};
use crate::event::Event;
use crate::event::EventResp;
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::tungstenite::Message;

use std::time::Duration;

use serde::{Deserialize, Serialize};
use tokio::sync::broadcast::{self, Sender};
use tokio_tungstenite::connect_async;
use tracing::*;
use url::Url;

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
    tx: Option<Sender<String>>,
    shutdown_tx: Option<broadcast::Sender<()>>,

    // The channel the socket will send events to
    event_tx: tokio::sync::mpsc::Sender<Event>,
}

pub struct RelayPool {
    relay_sockets_hashmap: std::collections::HashMap<String, RelaySocket>,
    event_tx: tokio::sync::mpsc::Sender<Event>,
}

impl RelayPool {
    pub fn new(relays: Vec<&str>, event_tx: tokio::sync::mpsc::Sender<Event>) -> Self {
        let mut relay_sockets_hashmap: std::collections::HashMap<String, RelaySocket> =
            std::collections::HashMap::new();

        for relay in relays {
            if relay_sockets_hashmap.contains_key(relay) {
                continue;
            }

            let mut relay = RelaySocket::new(relay.to_string(), event_tx.clone());
            relay.connect();
            relay_sockets_hashmap.insert(relay.get_relay(), relay);
        }
        Self {
            relay_sockets_hashmap,
            event_tx,
        }
    }

    pub fn add(&mut self, relay: &str) {
        if !self.relay_sockets_hashmap.contains_key(relay) {
            let event_tx = self.event_tx.clone();
            let mut relay = RelaySocket::new(relay.to_string(), event_tx);
            relay.connect();
            self.relay_sockets_hashmap.insert(relay.get_relay(), relay);
        }
    }

    pub fn set_relays(&mut self, relays: Vec<&str>) {
        // if relay in hashmap but not in relays, shutdown and remove socket
        let keys = self
            .relay_sockets_hashmap
            .keys()
            .cloned()
            .collect::<Vec<String>>();
        for relay in keys {
            if !relays.contains(&relay.as_str()) {
                let relay = self.relay_sockets_hashmap.get(&relay).unwrap();
                relay.shutdown();
                self.relay_sockets_hashmap.remove(&relay.get_relay());
            }
        }

        // if relay not in hashmap, create new socket
        for relay in relays {
            if !self.relay_sockets_hashmap.contains_key(relay) {
                let event_tx = self.event_tx.clone();
                let mut relay = RelaySocket::new(relay.to_string(), event_tx);
                relay.connect();
                self.relay_sockets_hashmap.insert(relay.get_relay(), relay);
            }
        }
    }

    pub fn get_relays(&self) -> Vec<String> {
        self.relay_sockets_hashmap
            .keys()
            .cloned()
            .collect::<Vec<String>>()
    }

    pub fn send(&mut self, msg: String) {
        for relay in self.relay_sockets_hashmap.values() {
            let tx = relay.get_tx().unwrap();
            match tx.send(msg.clone()) {
                Ok(_) => {}
                Err(e) => {
                    error!("Error sending to a relay: {}", e);
                }
            }
        }
    }
}

impl RelaySocket {
    pub fn new(relay: String, event_tx: tokio::sync::mpsc::Sender<Event>) -> Self {
        Self {
            relay,
            tx: None,
            event_tx,
            shutdown_tx: None,
        }
    }

    pub fn get_relay(&self) -> String {
        self.relay.clone()
    }

    pub fn get_tx(&self) -> Option<Sender<String>> {
        self.tx.clone()
    }

    pub fn connect(&mut self) {
        let (tx, _) = broadcast::channel::<String>(32);
        let (invoke_shutdown, mut shutdown_listen) = broadcast::channel::<()>(1);
        self.shutdown_tx = Some(invoke_shutdown.clone());

        let relay = self.relay.clone();
        let event_tx = self.event_tx.clone();

        let tx_clone = tx.clone();

        let mut shutdown = false;

        tokio::spawn(async move {
            loop {
                if shutdown {
                    info!("Shutting down relay {}", relay);
                    break;
                }

                // check if we should shutdown with timeout
                tokio::select! {
                    _ = shutdown_listen.recv() => {
                        shutdown = true;
                        continue;
                    }
                    _ = tokio::time::sleep(Duration::from_secs(1)) => {}
                }

                // let tx_clone_2 = tx_clone.clone();
                // let mut rx2 = tx_clone_2.subscribe();

                let url = match Url::parse(&relay) {
                    Ok(url) => url,
                    Err(e) => {
                        error!("Invalid relay url: {}", e);
                        shutdown = true;
                        continue;
                    }
                };

                let (socket, _) = match connect_async(url).await {
                    Ok(s) => {
                        info!("Connected to {}", relay);
                        s
                    }
                    Err(_) => {
                        error!("Error connecting to {}", relay);
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
                    // info!("Listening for next message on {}...", relay);
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
                            debug!("Received message from {}: {:?}", relay, msg);
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

                                                    // if event is metadata (kind = 0), verify nip05 if present
                                                    if e.kind == 0 {
                                                        let json = serde_json::from_str::<serde_json::Value>(&e.content).unwrap();
                                                        match json["nip05"].as_str() {
                                                            Some("") => {
                                                                debug!("empty nip05 for event: {:?}", id_prefix);
                                                            },
                                                            Some(nip05) => {
                                                                match json["name"].as_str() {
                                                                    Some(name) => {
                                                                        let pubkey = e.clone().pubkey;
                                                                        match verify_nip05(name.to_string(), nip05.to_string(), pubkey).await {
                                                                            Ok(_) => {
                                                                                debug!("verified nip05 for event: {:?}", id_prefix);
                                                                            },
                                                                            Err(err) => {
                                                                                error!("failed to verify nip05 for event: {:?}  error: {:?} for nip05: {:?} with name: {:?}", id_prefix, err, nip05, name);
                                                                                let mut json = serde_json::from_str::<serde_json::Value>(&e.content).unwrap();
                                                                                json["nip05"] = serde_json::Value::String("".to_string());
                                                                                e.content = json.to_string();
                                                                            }
                                                                        }
                                                                    },
                                                                    None => {}
                                                                }
                                                            },
                                                            None => {}
                                                        }
                                                    }

                                                    debug!(
                                                            "successfully parsed/validated event: {:?} relay: {:?}",
                                                            id_prefix, &relay
                                                        );

                                                    if let Err(_) = &event_tx.send(e.clone()).await {
                                                        error!("receiver dropped");
                                                        break;
                                                    }
                                                }
                                                Err(_) => {
                                                    error!("client sent an invalid event");
                                                }
                                            }
                                        }
                                        NostrMessage::EOSEMsg(eose) => {
                                            info!(
                                                "received EOSE message from relay {:?}: {:?}",
                                                relay, eose
                                            );

                                            if eose.cmd != "EOSE" && eose.cmd != "NOTICE" {
                                                error!(
                                                    "received EOSE message with invalid command: {:?}",
                                                    eose.cmd
                                                );
                                                continue;
                                            }

                                            if eose.cmd == "NOTICE" {
                                                debug!("NOTICE: {:?}", eose.id);
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

        self.tx = Some(tx);
    }

    pub fn shutdown(&self) {
        if let Some(tx) = &self.shutdown_tx {
            match tx.send(()) {
                Ok(_) => {
                    info!("shutdown signal sent");
                }
                Err(e) => {
                    error!("error sending shutdown signal: {:?}", e);
                }
            }
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

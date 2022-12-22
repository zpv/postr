extern crate tokio;
extern crate websocket;

use crate::db;
use crate::error::{Error, Result};
use crate::event::Event;
use crate::event::EventResp;

use std::env;
use std::fs;
use std::path::Path;

use tokio::runtime::Builder;
use tokio::sync::broadcast::{self, Receiver, Sender};
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tracing::*;
use websocket::{ClientBuilder, Message, OwnedMessage};

use console_subscriber::ConsoleLayer;
use serde::{Deserialize, Serialize};
use serde_json::json;

/// Nostr protocol messages from a client
#[derive(Deserialize, Serialize, Clone, PartialEq, Eq, Debug)]
#[serde(untagged)]
pub enum NostrMessage {
    /// An `EVENT` message
    EventMsg(EventResp),
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
            debug!("parse error on message: {}", msg.trim());
            Err(Error::ProtoParseError)
        }
    }
}

pub async fn connect(event_tx: tokio::sync::mpsc::Sender<Event>) {
    let server = "wss://satstacker.cloud";
    let message = r#"["REQ", "cid", { "limit": 1 }]"#;

    // Connect to the WebSocket server
    let mut client = ClientBuilder::new(server).unwrap().connect(None).unwrap();

    // Send the initial message
    client.send_message(&Message::text(message));

    // Receive messages and print them
    for message in client.incoming_messages() {
        // if message is text, convert to NostrMessage

        if let OwnedMessage::Text(msg) = message.unwrap() {
            let parsed_msg = convert_to_msg(msg, None);
            match parsed_msg {
                Ok(m) => {
                    match m {
                        NostrMessage::EventMsg(ec) => {
                            let evid = ec.event_id().to_owned();
                            let parsed: Result<Event> = Result::<Event>::from(ec);

                            match parsed {
                                Ok(e) => {
                                    let id_prefix: String = e.id.chars().take(8).collect();
                                    debug!(
                                        "successfully parsed/validated event: {:?}",
                                        id_prefix
                                    );
                                    // check if the event is too far in the future.
                                        // Write this to the database.
																			if let Err(_) = event_tx.send(e.clone()).await {
																					error!("receiver dropped");
																					return;
																			}
                                }
                                Err(e) => {
                                    error!("client sent an invalid event");
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    error!("Error: {:?}", e);
                }
            }
        }
    }
}

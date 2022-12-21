extern crate websocket;
extern crate tokio;

use std::env;
use std::error::Error;

use websocket::{ClientBuilder, OwnedMessage, Message};
use tokio::prelude::*;

#[cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    // runs connect() in a separate thread
    std::thread::spawn(|| {
        connect();
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn connect() {
    let server = "wss://satstacker.cloud";
    let message = r#"["REQ", "cid", { "limit": 1 }]"#;

    // Connect to the WebSocket server
    let mut client = ClientBuilder::new(server)
        .unwrap()
        .connect(None)
        .unwrap();

    // Send the initial message
    client.send_message(&Message::text(message));

    // Receive messages and print them
    for message in client.incoming_messages() {
        let message: OwnedMessage = message.unwrap();
        println!("Received message: {:?}", message);
    }
}

use std::sync::RwLock;

use nostr_rust::Identity;


pub struct InnerState {
	pub privkey: String,
	pub pubkey: String,
}

pub struct PostrState(pub RwLock<InnerState>);
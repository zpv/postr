use std::sync::RwLock;

pub struct InnerState {
	pub privkey: String,
	pub pubkey: String,
}

pub struct PostrState(pub RwLock<InnerState>);
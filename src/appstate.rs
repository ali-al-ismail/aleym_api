use crate::api::events::EventType;
use aleym_core::Representative;
use std::sync::Arc;
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct AppState {
	pub event_tx: broadcast::Sender<EventType>,
	//pub event_rx: broadcast::Receiver<T>, // events from the aleym_core
	pub repr: Arc<Representative>,
}

impl AppState {
	pub fn new(repr: Arc<Representative>) -> Self {
		let (event_tx, _) = broadcast::channel(8);
		AppState { event_tx, repr }
	}
}

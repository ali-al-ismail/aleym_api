use crate::api::events::EventType;
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct AppState {
	pub event_tx: broadcast::Sender<EventType>,
	//pub event_rx: broadcast::Receiver<T>, // events from the aleym_core
	//pub repr: Representation, // representation from the aleym_core
}

impl AppState {
	pub fn new() -> Self {
		let (event_tx, _) = broadcast::channel(8);
		AppState { event_tx }
	}
}

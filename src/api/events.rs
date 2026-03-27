use crate::appstate::AppState;
use axum::extract::State;
use axum::response::sse::{Event, KeepAlive, Sse};
use futures::{Stream, StreamExt};
use serde::Serialize;
use std::convert::Infallible;
use std::sync::Arc;
use tokio_stream::wrappers::BroadcastStream;

#[derive(Clone, Serialize)]
#[serde(tag = "type")]
pub enum EventType {
	Update,
	Failure,
	//Success,
}

/// SSE Endpoint handler
///
/// This endpoint provides a stream of events
///
/// # Response
/// ```json
/// {
/// "type":"Event Type"
/// }
/// ```
///
/// # Event Types
/// `Update` - Indicates that new articles have been successfully fetched and that the client should get them.
///
/// `Failure` - Indicates that an error has occured while fetching articles from a source.
pub async fn events_handler(State(state): State<Arc<AppState>>) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
	let event_rx = state.event_tx.subscribe();
	let stream = BroadcastStream::new(event_rx).filter_map(|result| async {
		match result {
			Ok(event) => Some(Ok(Event::default().json_data(event).unwrap())), // i dont like unwrapping here but it should be fine
			Err(_) => None, // either connection closed or lagged ignore for now
		}
	});

	Sse::new(stream).keep_alive(KeepAlive::default())
}

// TODO: need tests for SSE response

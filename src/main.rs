mod api;
mod app;
mod appstate;
mod config;
use aleym_core::Event;
use aleym_core::Representative;
use std::sync::Arc;

use crate::api::events::EventType;
use crate::app::App;

#[tokio::main]
async fn main() {
	let config: config::Config = config::Config::load();
	let port: u16 = config.network.port;
	let host = config.network.host;
	let db_file = config.paths.db_file;

	let mut repr = Representative::new(Some(db_file.as_path()))
		.await
		.expect("Couldn't create Aleym Representative");

	// placeholder, should handle errors and inform the user via webgui before applying migrations
	if repr.storage.has_pending_migrations().await.unwrap() {
		println! {"Detected pending migrations, running..."};
		repr.storage.apply_migrations().await.unwrap();
	}

	// need to create a root source directory
	if repr.storage.get_root_directories().await.unwrap().is_empty() {
		println!("Creating root source directory...");
		repr.storage
			.create_source_directory(None, "root".to_string(), None)
			.await
			.unwrap();
	}

	// set up rx and tx for events
	let mut event_rx = repr.open_events_channel();
	let repr = Arc::new(repr);
	let appstate = appstate::AppState::new(repr);
	let event_tx = appstate.event_tx.clone();

	let repr = appstate.repr.clone();
	let app = App::new(appstate);
	let router = app.build();

	tokio::join!(
		async move { repr.start_scheduler().await.unwrap() },
		async move {
			while let Some(event) = event_rx.recv().await {
				let event_type = match event {
					Event::NewsUpdated { .. } => EventType::Update,
					Event::InformantError { source_id: _, error } => {
						println!("failed fetch to news from a source: {error}");
						EventType::Failure
					}
				};
				let _ = event_tx.send(event_type);
			}
		},
		async move {
			println!("Starting server on {}:{}", host, port);
			let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
				.await
				.unwrap();
			axum::serve(listener, router).await.unwrap();
		}
	);
}

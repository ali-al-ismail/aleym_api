mod api;
mod app;
mod appstate;
mod config;
use aleym_core::Representative;
use std::sync::Arc;

use crate::app::App;

#[tokio::main]
async fn main() {
	let config: config::Config = config::Config::load();
	let port: u16 = config.network.port;
	let host = config.network.host;
	let db_file = config.paths.db_file;

	let repr = Representative::new(Some(db_file.as_path()))
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

	let appstate = appstate::AppState::new(Arc::new(repr));
	let app = App::new(appstate);
	let router = app.build();

	println!("Starting server on {}:{}", host, port);
	let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
		.await
		.unwrap();
	axum::serve(listener, router).await.unwrap();
}

mod api;
mod app;
mod appstate;
mod config;
use aleym_core::Representative;
use std::sync::Arc;

#[tokio::main]
async fn main() {
	let config: config::Config = config::Config::load();
	let port: u16 = config.network.port;
	let host = config.network.host;
	let db_file = config.paths.db_file;

	let repr = Representative::new(Some(db_file.as_path()))
		.await
		.expect("Couldn't create Aleym Representative");

	let appstate = appstate::AppState::new(Arc::new(repr));
	let app = app::build(Arc::new(appstate));

	println!("Starting server on {}:{}", host, port);
	let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
		.await
		.unwrap();
	axum::serve(listener, app).await.unwrap();
}

mod api;
mod app;
mod appstate;
mod config;

#[tokio::main]
async fn main() {
	let appstate = appstate::AppState::new();
	let app = app::build(appstate);

	let config: config::Config = config::Config::load();
	let port: u16 = config.network.port;
	let host = config.network.host;
	println!("Starting server on {}:{}", host, port);
	let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
		.await
		.unwrap();
	axum::serve(listener, app).await.unwrap();
}

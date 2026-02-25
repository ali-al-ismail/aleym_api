mod api;
mod app;
mod appstate;
mod config;

#[tokio::main]
async fn main() {
	let appstate = appstate::AppState::new();
	let app = app::build(appstate);

	let config: config::Config = config::Config::load();
	let port: u16 = config.port;

	let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
		.await
		.unwrap();
	axum::serve(listener, app).await.unwrap();
}

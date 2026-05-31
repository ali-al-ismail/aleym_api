mod api;
mod app;
mod appstate;
mod config;
use crate::api::events::EventType;
use crate::app::App;
use aleym_core::Event;
use aleym_core::Representative;
use aleym_core::db::StorageConnection;
use aleym_core::db::time::Duration;
use std::sync::Arc;
use tracing_subscriber::EnvFilter;
#[tokio::main]
async fn main() {
	tracing_subscriber::fmt()
		.with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("warn")))
		.with_target(true)
		.init();

	let config: config::Config = config::Config::load();
	let port: u16 = config.network.port;
	let tor_proxy_port: u16 = config.network.tor_proxy_port;
	let host = config.network.host;
	let db_file = config.paths.db_file;
	let ml_config = aleym_core::ml::scheduler::Config {
		min_fetch_interval: Duration::seconds(config.scheduler.min_fetch_interval),
		max_fetch_interval: Duration::seconds(config.scheduler.max_fetch_interval),
		short_term_cutoff_time: Duration::seconds(config.scheduler.short_term_cutoff_time),
		long_term_cutoff_time: Duration::seconds(config.scheduler.long_term_cutoff_time),
		fetch_freshness_bias: config.scheduler.fetch_freshness_bias,
		signals_count_limit: config.scheduler.signals_count_limit,
		publication_window_new_items_count_threshold: config.scheduler.publication_window_new_items_count_threshold,
	};
	let mut repr = Representative::new(Some(db_file.as_path()))
		.await
		.expect("Couldn't create Aleym Representative");

	// placeholder, should handle errors and inform the user via webgui before applying migrations
	if repr.storage.has_pending_migrations().await.unwrap() {
		tracing::warn!("Detected pending migrations, running...");
		repr.storage.apply_migrations().await.unwrap();
	}

	// need to create a root source directory
	if repr.storage.get_root_directories().await.unwrap().is_empty() {
		tracing::info!("Creating root source directory...");
		repr.storage
			.create_source_directory(None, "root".to_string(), None)
			.await
			.unwrap();
	}

	// set up rx and tx for events
	let mut event_rx = repr.open_events_channel();
	let notif = StorageConnection::open_notifications_channel(&mut repr.storage);
	let repr = Arc::new(repr);
	let appstate = appstate::AppState::new(repr);
	let event_tx = appstate.event_tx.clone();

	let proxy_repr = appstate.repr.clone();
	let sched_repr = appstate.repr.clone();
	let app = App::new(appstate);
	let router = app.build();

	tokio::join!(
		async move { sched_repr.start_scheduler(notif, ml_config).await.unwrap() },
		async move {
			while let Some(event) = event_rx.recv().await {
				let event_type = match event {
					Event::NewsUpdated { .. } => EventType::Update,
					Event::InformantError { source_id: _, error } => {
						tracing::error!("failed fetch to news from a source: {error}");
						EventType::Failure
					}
				};
				let _ = event_tx.send(event_type);
			}
		},
		async move {
			tracing::warn!("Starting server at {}:{}", host, port);
			let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
				.await
				.unwrap();
			axum::serve(listener, router).await.unwrap();
		},
		async move {
			let proxy_addr = format!("127.0.0.1:{}", tor_proxy_port);
			tracing::warn!("Starting SOCKS5 proxy at {}", proxy_addr);
			proxy_repr.network.run_tor_socks5_proxy(proxy_addr).await.unwrap();
		}
	);
}

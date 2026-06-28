#![recursion_limit = "256"]
mod config;
mod handlers;
use crate::handlers::{
	categories::{
		assign_category_to_source, create_category, delete_category, edit_category, get_all_categories,
		get_categories_of_source, unassign_category_from_source,
	},
	cfg::{get_config, update_config},
	feedback::store_user_feedback_signal,
	labels::{
		assign_label_to_news, create_news_label, delete_news_label, edit_news_label, get_all_news_labels,
		get_labels_of_news, get_news_label, unassign_label_from_news,
	},
	news::{get_news, get_news_recommendations, get_news_with_filter, set_news_read},
	sources::{add_source, delete_source, edit_source, get_all_sources, get_source, get_sources_by_category},
};

use aleym_core::Event;
use aleym_core::Representative;
use aleym_core::db::StorageConnection;
use aleym_core::db::time::Duration;
use std::sync::Arc;
use tauri::Emitter;
use tauri::Manager;
use tracing_subscriber::EnvFilter;

pub struct AppState {
	repr: Arc<Representative>,
}

#[tauri::command]
fn get_build_info() -> (String, String) {
	(env!("BUILD_DATE").to_string(), env!("GIT_HASH").to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tracing_subscriber::fmt()
		.with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("warn")))
		.with_target(true)
		.init();
	let config = config::Config::load();
	let tor_proxy_port: u16 = config.network.tor_proxy_port;
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
	tracing::debug!("Proxy port: {tor_proxy_port}");
	tracing::debug!("DB file: {:?}", db_file);
	tracing::debug!("Config loaded successfully.");

	tracing::warn!("Application starting...");
	tauri::Builder::default()
		.plugin(tauri_plugin_notification::init())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_opener::init())
		.setup(move |app| {
			//let window = app.get_webview_window("main").unwrap();
			let mut repr = tauri::async_runtime::block_on(async {
				let repr = Representative::new(Some(db_file.as_path()))
					.await
					.expect("Failed to create a representative");

				if repr.storage.has_pending_migrations().await.unwrap() {
					tracing::warn!("Detected pending migrations, running...");
					repr.storage.apply_migrations().await.unwrap();
					tracing::warn!("Migrations applied successfully.");
				}

				// create a root directory for sources
				if repr.storage.get_root_directories().await.unwrap().is_empty() {
					repr.storage
						.create_source_directory(None, "root".to_string(), None)
						.await
						.unwrap();
					tracing::warn!("Created root directory for sources.");
				}
				repr
			});

			// set up threads
			let mut event_rx = repr.open_events_channel();
			let notif = StorageConnection::open_notifications_channel(&mut repr.storage);
			let repr = Arc::new(repr);
			let sched_repr = repr.clone();
			let proxy_repr = repr.clone();
			app.manage(AppState { repr });
			let app_handle = app.handle().clone();
			// scheduler thread
			tauri::async_runtime::spawn(async move {
				let mut rng: rand::rngs::StdRng = rand::make_rng();
				sched_repr.start_scheduler(notif, ml_config, &mut rng).await.unwrap()
			});
			// core library events thread
			tauri::async_runtime::spawn(async move {
				while let Some(event) = event_rx.recv().await {
					tracing::debug!("Received event: {:?}", event);
					match event {
						Event::InformantError { source_id, error } => {
							app_handle.emit("informant_error", (source_id, error)).unwrap();
						} // send error event
						Event::NewsUpdated { source_id, updates } => {
							let number_of_news = updates.new.len();
							app_handle.emit("news_updated", (source_id, number_of_news)).unwrap();
						} // we should send the event and also the new items to prevent the frontend from having to fetch again
					}
				}
			});
			// tor proxy thread
			tauri::async_runtime::spawn(async move {
				let proxy_addr = format!("127.0.0.1:{tor_proxy_port}");
				tracing::warn!("Starting SOCK5 proxy at {proxy_addr}");
				proxy_repr.network.run_tor_socks5_proxy(proxy_addr).await.unwrap();
			});
			// event emitter / listener thread for frontend and backend communication
			//tauri::async_runtime::spawn(async move {});

			Ok(())
		})
		.invoke_handler(tauri::generate_handler![
			get_all_categories,
			create_category,
			edit_category,
			delete_category,
			assign_category_to_source,
			unassign_category_from_source,
			get_categories_of_source,
			add_source,
			get_source,
			get_all_sources,
			delete_source,
			edit_source,
			get_sources_by_category,
			assign_label_to_news,
			create_news_label,
			edit_news_label,
			get_all_news_labels,
			get_news_label,
			get_labels_of_news,
			unassign_label_from_news,
			delete_news_label,
			get_news,
			get_news_recommendations,
			get_news_with_filter,
			set_news_read,
			get_config,
			update_config,
			store_user_feedback_signal,
			get_build_info,
		])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

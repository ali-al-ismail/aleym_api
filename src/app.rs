use crate::api::articles::{get_article_by_id, get_articles};
use crate::api::categories::{create_category, delete_category, get_categories, update_category};
use crate::api::events::events_handler;
use crate::api::sources::{get_source_by_id, get_sources};
use crate::appstate::AppState;
use axum::routing::{delete, get, post, put};
use std::sync::Arc;
use tower_http::services::{ServeDir, ServeFile};

pub fn build(appstate: Arc<AppState>) -> axum::Router {
	let source_routes = axum::Router::new()
		.route("/sources", get(get_sources))
		.route("/sources/{id}", get(get_source_by_id));

	let categories_routes = axum::Router::new()
		.route("/categories", get(get_categories))
		.route("/categories", post(create_category))
		.route("/categories/{id}", put(update_category))
		.route("/categories/{id}", delete(delete_category));

	let articles_routes = axum::Router::new()
		.route("/articles", get(get_articles))
		.route("/articles/{id}", get(get_article_by_id));

	let api_routes = source_routes.merge(categories_routes).merge(articles_routes);

	axum::Router::new()
		// api routes
		.nest("/api", api_routes)
		.route("/events", get(events_handler))
		.with_state(appstate)
		// static react files
		.fallback_service(ServeDir::new("web/dist").not_found_service(ServeFile::new("web/dist/index.html")))
}

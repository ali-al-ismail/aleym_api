use crate::api::articles::{get_article_by_id, get_articles};
use crate::api::categories::{create_category, delete_category, get_categories, update_category};
use crate::api::events::events_handler;
use crate::api::sources::{
	create_source, get_source_by_id, get_source_categories, get_sources, get_sources_by_category,
	link_source_to_category, unlink_source_to_category, update_source,
};
use crate::appstate::AppState;
use axum::routing::{delete, get, post, put};
use std::sync::Arc;
use tower_http::services::{ServeDir, ServeFile};

pub fn build(appstate: Arc<AppState>) -> axum::Router {
	let source_routes = axum::Router::new()
		.route("/sources", get(get_sources).post(create_source))
		.route("/sources/{id}", get(get_source_by_id).put(update_source))
		.route("/sources/{id}/categories", get(get_source_categories))
		.route(
			"/sources/{source_id}/categories/{category_id}",
			post(link_source_to_category).delete(unlink_source_to_category),
		);

	let categories_routes = axum::Router::new()
		.route("/categories", get(get_categories).post(create_category))
		.route("/categories/{id}", put(update_category).delete(delete_category))
		.route("/categories/{id}/sources", get(get_sources_by_category));

	let articles_routes = axum::Router::new()
		.route("/articles", get(get_articles))
		.route("/articles/{id}", get(get_article_by_id));

	let api_routes = source_routes.merge(categories_routes).merge(articles_routes);

	axum::Router::new()
		.nest("/api", api_routes)
		.route("/events", get(events_handler))
		.with_state(appstate)
		.fallback_service(ServeDir::new("web/dist").not_found_service(ServeFile::new("web/dist/index.html")))
}

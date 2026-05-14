use crate::api::articles::{
	get_article_by_id, get_articles, get_labels_of_news, link_label, recommend_articles, set_read_flag, unlink_label,
};
use crate::api::categories::{create_category, delete_category, get_categories, update_category};
use crate::api::events::events_handler;
use crate::api::feedback::process_feedback;
use crate::api::labels::{create_label, delete_label, get_labels, update_label};
use crate::api::sources::{
	create_source, delete_source, get_source_by_id, get_source_categories, get_sources, get_sources_by_category,
	link_source_to_category, manual_fetch, unlink_source_to_category, update_source,
};
use crate::appstate::AppState;
use axum::body::Body;
use axum::http::{Request, header};
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::routing::{get, post, put};
use axum_embed::{FallbackBehavior, ServeEmbed};
use rust_embed::RustEmbed;
use std::sync::Arc;

#[derive(RustEmbed, Clone)]
#[folder = "web/dist/"]
struct Assets;

pub struct App {
	pub state: Arc<AppState>,
}

impl App {
	pub fn new(state: AppState) -> App {
		Self { state: Arc::new(state) }
	}

	pub fn build(&self) -> axum::Router {
		let source_routes = axum::Router::new()
			.route("/sources", get(get_sources).post(create_source))
			.route(
				"/sources/{id}",
				get(get_source_by_id).put(update_source).delete(delete_source),
			)
			.route("/sources/{id}/categories", get(get_source_categories))
			.route(
				"/sources/{source_id}/categories/{category_id}",
				post(link_source_to_category).delete(unlink_source_to_category),
			)
			.route("/sources/{id}/fetch", get(manual_fetch));

		let categories_routes = axum::Router::new()
			.route("/categories", get(get_categories).post(create_category))
			.route("/categories/{id}", put(update_category).delete(delete_category))
			.route("/categories/{id}/sources", get(get_sources_by_category));

		let articles_routes = axum::Router::new()
			.route("/articles", get(get_articles))
			.route("/articles/{id}", get(get_article_by_id))
			.route("/articles/{id}/read", get(set_read_flag))
			.route("/articles/{id}/labels", get(get_labels_of_news))
			.route(
				"/articles/{id}/labels/{label_id}",
				post(link_label).delete(unlink_label),
			);

		let labels_routes = axum::Router::new()
			.route("/labels", get(get_labels).post(create_label))
			.route("/labels/{id}", put(update_label).delete(delete_label));

		let feedback_routes = axum::Router::new().route("/feedback", post(process_feedback));
		let recommendation_route = axum::Router::new().route("/recommend", get(recommend_articles));

		let api_routes = source_routes
			.merge(categories_routes)
			.merge(articles_routes)
			.merge(feedback_routes)
			.merge(recommendation_route)
			.merge(labels_routes);

		let assets = ServeEmbed::<Assets>::with_parameters(
			Some("index.html".to_string()),
			FallbackBehavior::Ok,
			Some("index.html".to_string()),
		);

		axum::Router::new()
			.nest("/api", api_routes)
			.route("/events", get(events_handler))
			.layer(middleware::from_fn(csp))
			.with_state(self.state.clone())
			.fallback_service(assets)
	}
}

async fn csp(request: Request<Body>, next: Next) -> Response {
	let mut response = next.run(request).await;
	response.headers_mut().insert(
		header::CONTENT_SECURITY_POLICY,
		"default-src 'self'; \
         script-src 'self'; \
         style-src 'self' 'unsafe-inline'; \
         img-src 'self' data: https: http:; \
         connect-src 'self' http://localhost:11434; \
         font-src 'self' data:; \
         media-src 'none'; \
         object-src 'none'"
			.parse()
			.unwrap(),
	);
	response
}

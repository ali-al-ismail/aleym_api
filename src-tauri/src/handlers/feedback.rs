use aleym_core::db::{time::Duration, time::OffsetDateTime, uuid::Uuid};
use serde::Deserialize;
use tauri::State;

use crate::{AppState, handlers::BackendError};

#[derive(Deserialize)]
pub enum UserFeedbackSignal {
	Appearance {
		news: Uuid,
		happened_at: i64,
		duration: i64,
	},
	Focus {
		news: Uuid,
		done_at: i64,
		duration: i64,
	},
	Read {
		news: Uuid,
		done_at: i64,
		duration: i64,
		scroll_depth_percentage: i8,
	},
	ExplicitVote {
		news: Uuid,
		done_at: i64,
		is_up_vote: bool,
	},
}
#[tauri::command]
pub async fn store_user_feedback_signal(
	state: State<'_, AppState>,
	feedback: UserFeedbackSignal,
) -> Result<(), BackendError> {
	state.repr.storage.store_user_feedback_signal(feedback.into()).await?;
	Ok(())
}

impl From<UserFeedbackSignal> for aleym_core::db::UserFeedbackSignal {
	fn from(signal: UserFeedbackSignal) -> Self {
		match signal {
			UserFeedbackSignal::Appearance {
				news,
				happened_at,
				duration,
			} => Self::NewsApearanceSignal {
				news,
				happened_at: OffsetDateTime::from_unix_timestamp(happened_at).unwrap(),
				duration: Duration::milliseconds(duration),
			},
			UserFeedbackSignal::Focus {
				news,
				done_at,
				duration,
			} => Self::NewsFocusSignal {
				news,
				done_at: OffsetDateTime::from_unix_timestamp(done_at).unwrap(),
				duration: Duration::milliseconds(duration),
			},
			UserFeedbackSignal::Read {
				news,
				done_at,
				duration,
				scroll_depth_percentage,
			} => Self::NewsReadSignal {
				news,
				done_at: OffsetDateTime::from_unix_timestamp(done_at).unwrap(),
				duration: Duration::milliseconds(duration),
				scroll_depth_percentage,
			},
			UserFeedbackSignal::ExplicitVote {
				news,
				done_at,
				is_up_vote,
			} => Self::NewsExplicitVoteSignal {
				news,
				done_at: OffsetDateTime::from_unix_timestamp(done_at).unwrap(),
				is_up_vote,
			},
		}
	}
}

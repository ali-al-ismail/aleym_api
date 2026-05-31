# API Endpoints

All endpoints are prefixed with `/api`. Timestamps are Unix timestamps in seconds. UUIDs are standard UUID v4 strings.

Currently most errors return with `500 Internal Server Error` and a string detailing the error message in the response body.

---

## Events

### `GET /events`
Establishes a Server-Sent Events (SSE) connection for real-time scheduler updates.

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | SSE stream established |

**Event Types:**
| Type | Description |
|------|-------------|
| `Update` | A source was successfully fetched and new articles are available |
| `Failure` | A source fetch failed |

---

## Sources

### `GET /api/sources`
Retrieves all sources.

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns a list of all sources |
| `500 Internal Server Error` | Failed to retrieve sources |

**Response Body:**
```json
[
    {
        "id": "uuid",
        "parent_directory": "uuid",
        "informant": 1,
        "networktype": "Clear",
        "name": "source name",
        "description": "source description or null",
        "icon_uri": "uri or null",
        "logo_uri": "uri or null",
        "custom_id": "custom id or null",
        "is_enabled": true,
        "url": "source url or null"
    }
]
```

**Informant Types:**
| Value | Description |
|-------|-------------|
| `1` | FeedRs (RSS/Atom/JSON feed) |
| `2` | TelegramWeb |

---

### `POST /api/sources`
Creates a new source.

**Request Body:**
```json
{
    "name": "source name",
    "description": "source description",
    "network": "Clear",
    "informant": { "FeedRs": { "feed_url": "https://example.com/feed.rss" } }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Name of the source |
| `description` | No | Optional description, can be omitted or `null` |
| `network` | Yes | `"Clear"` or `"Tor"` |
| `informant` | Yes | Informant type and parameters |

**Informant Parameters:**

FeedRs:
```json
{ "FeedRs": { "feed_url": "https://example.com/feed.rss" } }
```

TelegramWeb:
```json
{ "TelegramWeb": { "channel_id": "channelname" } }
```

**Response:**
| Status Code | Description |
|-------------|-------------|
| `201 Created` | Returns the UUID of the created source |
| `500 Internal Server Error` | Failed to create source |

---

### `GET /api/sources/{id}`
Retrieves a source by its UUID.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the source |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns the source |
| `500 Internal Server Error` | Failed to retrieve source |

**Response Body:**
```json
{
    "id": "uuid",
    "parent_directory": "uuid",
    "informant": 1,
    "networktype": "Clear",
    "name": "source name",
    "description": "source description or null",
    "icon_uri": "uri or null",
    "logo_uri": "uri or null",
    "custom_id": "custom id or null",
    "is_enabled": true,
    "url": "source url or null"
}
```

---

### `PUT /api/sources/{id}`
Updates an existing source.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the source to update |

**Request Body:**
```json
{
    "name": "new source name",
    "description": "new description or null",
    "network": "Clear",
    "is_enabled": true
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | New name of the source |
| `description` | Yes | New description, set to `null` to clear |
| `network` | Yes | `"Clear"` or `"Tor"` |
| `is_enabled` | Yes | Whether the source is enabled |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Source updated successfully |
| `500 Internal Server Error` | Failed to update source |

---

### `DELETE /api/sources/{id}`
Deletes a source by its UUID.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the source to delete |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Source deleted successfully |
| `500 Internal Server Error` | Failed to delete source |

---

### `GET /api/sources/{id}/categories`
Retrieves all categories assigned to a source.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the source |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns a list of categories |
| `500 Internal Server Error` | Failed to retrieve categories |

**Response Body:**
```json
[
    {
        "id": "uuid",
        "name": "category name",
        "description": "category description or null"
    }
]
```

---

### `POST /api/sources/{source_id}/categories/{category_id}`
Assigns a category to a source.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `source_id` | UUID of the source |
| `category_id` | UUID of the category |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Category assigned successfully |
| `500 Internal Server Error` | Failed to assign category |

---

### `DELETE /api/sources/{source_id}/categories/{category_id}`
Removes a category assignment from a source.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `source_id` | UUID of the source |
| `category_id` | UUID of the category |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Category unassigned successfully |
| `500 Internal Server Error` | Failed to unassign category |

---

### `GET /api/sources/{id}/fetch`
Manually triggers the informant to fetch news for a specific source.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the source to fetch |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Fetch triggered successfully |
| `500 Internal Server Error` | Failed to trigger fetch |

---

## Categories

### `GET /api/categories`
Retrieves all categories.

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns a list of all categories |
| `500 Internal Server Error` | Failed to retrieve categories |

**Response Body:**
```json
[
    {
        "id": "uuid",
        "name": "category name",
        "description": "category description or null"
    }
]
```

---

### `POST /api/categories`
Creates a new category.

**Request Body:**
```json
{
    "name": "category name",
    "description": "category description"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Must be unique |
| `description` | No | Optional, can be omitted or `null` |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `201 Created` | Returns the UUID of the created category |
| `500 Internal Server Error` | Failed to create category (e.g. duplicate name) |

---

### `PUT /api/categories/{id}`
Updates an existing category.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the category to update |

**Request Body:**
```json
{
    "name": "new category name",
    "description": "new description or null"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | New name, must be unique |
| `description` | No | If omitted, existing description is left unchanged. Set to `null` to clear it. Pass a value wrapped in an extra layer (`"description": "value"`) to update it |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Category updated successfully |
| `500 Internal Server Error` | Failed to update category |

---

### `DELETE /api/categories/{id}`
Deletes a category by its UUID.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the category to delete |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Category deleted successfully |
| `500 Internal Server Error` | Failed to delete category |

---

### `GET /api/categories/{id}/sources`
Retrieves all sources assigned to a category.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the category |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns a list of sources |
| `500 Internal Server Error` | Failed to retrieve sources |

**Response Body:**
```json
[
    {
        "id": "uuid",
        "parent_directory": "uuid",
        "informant": 1,
        "networktype": "Clear",
        "name": "source name",
        "description": "source description or null",
        "icon_uri": "uri or null",
        "logo_uri": "uri or null",
        "custom_id": "custom id or null",
        "is_enabled": true,
        "url": "source url or null"
    }
]
```

---

## Articles

### `GET /api/articles`
Retrieves a paginated list of articles with optional filtering and sorting.

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `limit` | No | Maximum number of articles to return, defaults to `50` |
| `after` | No | Unix timestamp, only return articles fetched after this time |
| `before` | No | Unix timestamp, only return articles fetched before this time |
| `sort_order` | No | Sort based on `first_fetched_at`, either `"asc"` or `"desc"`, defaults to `"desc"` |
| `source_id` | No | Filter by one or more source UUIDs, repeat the parameter for multiple values. Takes priority over `category_id` |
| `category_id` | No | Filter by one or more category UUIDs, repeat the parameter for multiple values |
| `query` | No | Text search query |
| `labels` | No | Filter by one or more label UUIDs, repeat the parameter for multiple values |
| `is_read` | No | Filter by read/unread status |

If neither `source_id` nor `category_id` is provided, returns all articles from the root directory.

**Example:**
```
GET /api/articles?source_id=uuid1&source_id=uuid2&labels=uuid3&is_read=false
```

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns a list of articles |
| `500 Internal Server Error` | Failed to retrieve articles |

**Response Body:**
```json
[
    {
        "id": "uuid",
        "source": "uuid",
        "title": "article title",
        "uri": "article uri or null",
        "summary": "article summary or null",
        "has_content": true,
        "first_fetched_at": 1234567890,
        "last_fetched_at": 1234567890,
        "published_at": 1234567890,
        "is_read": false
    }
]
```

---

### `GET /api/articles/{id}`
Retrieves a single article by its UUID, including its full content.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the article |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns the full article |
| `500 Internal Server Error` | Failed to retrieve article |

**Response Body:**
```json
{
    "id": "uuid",
    "source": "uuid",
    "title": "article title",
    "uri": "article uri or null",
    "summary": "article summary or null",
    "content": "full article content or null",
    "first_fetched_at": 1234567890,
    "last_fetched_at": 1234567890,
    "published_at": 1234567890,
    "is_read": false
}
```

---

### `GET /api/articles/{id}/read`
Sets the read/unread status of an article.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the article |

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `is_read` | Yes | `true` or `false` |

**Example:**
```
GET /api/articles/uuid/read?is_read=true
```

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Read status updated successfully |
| `500 Internal Server Error` | Failed to update read status |

---

### `GET /api/articles/{id}/labels`
Retrieves all labels assigned to an article.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the article |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns a list of labels |
| `500 Internal Server Error` | Failed to retrieve labels |

**Response Body:**
```json
[
    {
        "id": "uuid",
        "name": "label name",
        "description": "label description or null"
    }
]
```

---

### `POST /api/articles/{id}/labels/{label_id}`
Assigns a label to an article.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the article |
| `label_id` | UUID of the label |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Label assigned successfully |
| `500 Internal Server Error` | Failed to assign label |

---

### `DELETE /api/articles/{id}/labels/{label_id}`
Removes a label from an article.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the article |
| `label_id` | UUID of the label |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Label removed successfully |
| `500 Internal Server Error` | Failed to remove label |

---

## Labels

### `GET /api/labels`
Retrieves all labels.

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns a list of all labels |
| `500 Internal Server Error` | Failed to retrieve labels |

**Response Body:**
```json
[
    {
        "id": "uuid",
        "name": "label name",
        "description": "label description or null"
    }
]
```

---

### `POST /api/labels`
Creates a new label.

**Request Body:**
```json
{
    "name": "label name",
    "description": "label description"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Name of the label |
| `description` | No | Optional description, can be omitted or `null` |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `201 Created` | Returns the UUID of the created label |
| `500 Internal Server Error` | Failed to create label |

---

### `PUT /api/labels/{id}`
Updates an existing label.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the label to update |

**Request Body:**
```json
{
    "name": "new label name",
    "description": "new description or null"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | If omitted, existing name is left unchanged |
| `description` | No | If omitted, existing description is left unchanged. Set to `null` to clear it |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Label updated successfully |
| `500 Internal Server Error` | Failed to update label |

---

### `DELETE /api/labels/{id}`
Deletes a label by its UUID.

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | UUID of the label to delete |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Label deleted successfully |
| `500 Internal Server Error` | Failed to delete label |

---

## Recommendations

### `GET /api/recommend`
Retrieves a list of recommended articles based on user feedback signals.

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `limit` | No | Maximum number of articles to return, defaults to `50` |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns a list of recommended articles |
| `500 Internal Server Error` | Failed to retrieve recommendations |

**Response Body:**
```json
[
    {
        "id": "uuid",
        "source": "uuid",
        "title": "article title",
        "uri": "article uri or null",
        "summary": "article summary or null",
        "has_content": true,
        "first_fetched_at": 1234567890,
        "last_fetched_at": 1234567890,
        "published_at": 1234567890,
        "is_read": false
    }
]
```

---

## Feedback

### `POST /api/feedback`
Submits a user feedback signal used to improve recommendations.

**Request Body:**

One of the following variants:

**Appearance** — article appeared in the user's feed:
```json
{
    "Appearance": {
        "news": "uuid",
        "happened_at": 1234567890,
        "duration": 1000
    }
}
```

**Focus** — user focused on an article:
```json
{
    "Focus": {
        "news": "uuid",
        "done_at": 1234567890,
        "duration": 1000
    }
}
```

**Read** — user read an article:
```json
{
    "Read": {
        "news": "uuid",
        "done_at": 1234567890,
        "duration": 1000,
        "scroll_depth_percentage": 80
    }
}
```

**ExplicitVote** — user explicitly voted on an article:
```json
{
    "ExplicitVote": {
        "news": "uuid",
        "done_at": 1234567890,
        "is_up_vote": true
    }
}
```

| Field | Description |
|-------|-------------|
| `news` | UUID of the article |
| `happened_at` / `done_at` | Unix timestamp in seconds |
| `duration` | Duration in milliseconds |
| `scroll_depth_percentage` | Scroll depth as a percentage (0-100) |
| `is_up_vote` | `true` for upvote, `false` for downvote |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Feedback recorded successfully |
| `500 Internal Server Error` | Failed to record feedback |

---

## Config

### `GET /api/config`
Retrieves the current configuration.

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Returns the current configuration |
| `500 Internal Server Error` | Failed to retrieve configuration |

**Response Body:**
```json
{
    "min_fetch_interval": 900,
    "max_fetch_interval": 14400
}
```

| Field | Description |
|-------|-------------|
| `min_fetch_interval` | Minimum fetch interval in seconds |
| `max_fetch_interval` | Maximum fetch interval in seconds |

---

### `PUT /api/config`
Updates the configuration. Changes are persisted to disk and take effect after a restart.

**Request Body:**
```json
{
    "min_fetch_interval": 600,
    "max_fetch_interval": 7200
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `min_fetch_interval` | No | If omitted, existing value is left unchanged |
| `max_fetch_interval` | No | If omitted, existing value is left unchanged |

**Response:**
| Status Code | Description |
|-------------|-------------|
| `200 OK` | Configuration updated successfully |
| `500 Internal Server Error` | Failed to update configuration |

# API Endpoints

All endpoints are prefixed with `/api`. Timestamps are Unix timestamps in seconds. UUIDs are standard UUID v4 strings.

Currently most errors return with `500 Internal Server Error` and a String detailing the error message in the response body.

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
        "informant": 0,
        "networktype": "Clear",
        "name": "source name",
        "description": "source description or null",
        "icon_uri": "uri or null",
        "logo_uri": "uri or null",
        "custom_id": "custom id or null",
        "is_enabled": true
    }
]
```

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
    "informant": 0,
    "networktype": "Clear",
    "name": "source name",
    "description": "source description or null",
    "icon_uri": "uri or null",
    "logo_uri": "uri or null",
    "custom_id": "custom id or null",
    "is_enabled": true
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
| `description` | No | If omitted, existing description is left unchanged. Set to `null` to clear it |

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
| `sort_order` | No | Sort based on `first_fetched_at` either `"asc"` or `"desc"`, defaults to `"desc"` |
| `source_id` | No | Filter by a specific source UUID (takes priority over `category_id`) |
| `category_id` | No | Filter by a specific category UUID |

If neither `source_id` nor `category_id` is provided, returns all articles from the root directory.

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
    "content": "full article content or null",
    "first_fetched_at": 1234567890,
    "last_fetched_at": 1234567890,
    "published_at": 1234567890,
    "is_read": false
}
```

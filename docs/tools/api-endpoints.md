# API endpoints

*Reference.*

REST endpoints exposed by `ichava/browser`. All endpoints sit under `/{prefix}/api/...` where `{prefix}` defaults to `ichava` (set by `ICHAVA_BROWSER_PREFIX`).

### Base URL

```
/ichava/api
```

### Icon Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/icons` | List icons with filtering/pagination |
| GET | `/icons/{id}` | Get single icon details |
| GET | `/icons/{id}/svg` | Get SVG content |
| GET | `/icons/filters` | Get filter options |
| GET | `/icons/tree` | Get hierarchical tree |
| GET | `/icons/statistics` | Get statistics |

### Package Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/packages` | List all packages |
| GET | `/packages/{vendor/package}` | Get package details |

### Terms Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/terms/categories` | List all categories |
| GET | `/terms/variants` | List all variants |
| GET | `/terms/hierarchy` | Get hierarchical structure |

### Example Requests

```bash
# List icons with pagination
curl "http://example.com/ichava/api/icons?page=1&per_page=60"

# Search icons
curl "http://example.com/ichava/api/icons?search=home"

# Filter by package
curl "http://example.com/ichava/api/icons?packages[]=vendor/your-icons"

# Get statistics
curl "http://example.com/ichava/api/icons/statistics"
```

### API Response Format

```json
{
    "success": true,
    "data": { ... },
    "meta": {
        "total": 127806,
        "page": 1,
        "per_page": 60
    }
}
```

### Postman collection

A ready-to-import Postman collection ships with the browser package at [`.dev/postman_collection.json`](https://github.com/ichava/browser/blob/main/.dev/postman_collection.json). Import it into Postman, then set the collection variables:

| Variable | Default | Description |
|---|---|---|
| `base_url` | `http://example.com` | Host where Ichava is mounted |
| `package_name` | `vendor/your-icons` | Package used by examples that filter by `packages[]=` |

Every endpoint documented in the table above has a matching request in the collection.

---

---

[← Docs index](../../README.md#documentation)

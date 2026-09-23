[← Docs index](../README.md#documentation)

# Getting started

*How-to guide.* Reaching the icon browser and making your first REST call, once [Installation](installation.md) is done.

## Open the browser

With the config and assets published, the SPA is at:

```
http://example.com/ichava/icons
```

The `ichava` segment is the **prefix**, and it comes from `ICHAVA_BROWSER_PREFIX` in core's configuration rather than this package's — it is shared between core's API and this SPA, so changing it moves both. See [Configuration](configuration.md).

## Nothing appears until a pack is seeded

The browser renders whatever the registry holds, and core ships no icons. An empty browser almost always means the seed has not run:

```bash
composer require ichava/icon-sets-tabler
php artisan ichava::ichava-core.database seed --package=ichava/icon-sets-tabler
```

Every installed and seeded pack becomes searchable in the SPA with no further configuration.

## Your first REST call

The same data is available as JSON:

```bash
curl "https://example.com/ichava/api/icons?search=home&package=ichava/icon-sets-tabler"
```

The PHP equivalent, from inside a Laravel application:

```php
use Illuminate\Support\Facades\Http;

$icons = Http::get('https://example.com/ichava/api/icons', [
    'search'  => 'home',
    'package' => 'ichava/icon-sets-tabler',
])->json();
```

[API endpoints](tools/api-endpoints.md) documents every route, its parameters and its response shape.

## Know which auth stack you got

Browser adapts to the host application rather than imposing a stack, so the protection your API has depends on what your app exposes. In a **stateless** host there is no session and no CSRF, and the JSON API should be treated as public unless you put your own authentication in front of it.

[Architecture](architecture.md) sets out all three cases.

## See also

- [Configuration](configuration.md)
- [Environment variables](environment.md)
- [Architecture](architecture.md)

---

[← Docs index](../README.md#documentation)

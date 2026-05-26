<div align="center">

# @mongez/concat-route

**A tiny, dependency-free path joiner. Glue any number of segments into a single normalized leading-slash path — even when inputs have stray slashes, empty strings, or `null` / `undefined`.**

[![npm](https://img.shields.io/npm/v/@mongez/concat-route.svg)](https://www.npmjs.com/package/@mongez/concat-route)
[![license](https://img.shields.io/npm/l/@mongez/concat-route.svg)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@mongez/concat-route.svg)](https://bundlephobia.com/package/@mongez/concat-route)
[![downloads](https://img.shields.io/npm/dw/@mongez/concat-route.svg)](https://www.npmjs.com/package/@mongez/concat-route)

</div>

---

## Why @mongez/concat-route?

`path.posix.join("foo", "bar")` returns `"foo/bar"` — no leading slash, which is exactly what every URL path needs. `node:path` isn't available in the browser without a polyfill. Manual `if (base.endsWith("/"))` slash juggling is the wart that spreads through every API helper. `@mongez/concat-route` is one variadic function (under ten lines of source) that always returns a leading-slash path, drops falsy segments silently so optional locale/feature prefixes thread through without conditionals, and collapses arbitrary runs of `/` — including the embedded ones a sibling helper might leave behind. Zero runtime dependencies, browser-safe, default export.

```ts
import concatRoute from "@mongez/concat-route";

const API_BASE = "/api/v1";

concatRoute(API_BASE, "users", String(userId));
// "/api/v1/users/42"

concatRoute("/", locale ?? "", "products", slug);
// locale = "en"  →  "/en/products/foo"
// locale = null  →  "/products/foo"
```

---

## Features

| Feature | Description |
|---|---|
| **Always leading `/`** | Result starts with exactly one `/`, regardless of how the inputs were formatted. |
| **Never trailing `/`** | The only time the result ends with `/` is when it IS `"/"` (the root, when there's nothing else to return). |
| **Falsy segments dropped** | `""`, `null`, `undefined`, `0`, and `false` are filtered out — thread optional pieces without `if`s. |
| **Slash collapse** | Runs of `/` anywhere in the joined result collapse to a single `/`, including embedded `//` inside a single segment. |
| **Variadic** | Takes any number of arguments. Spread arrays directly with `concatRoute(...crumbs)`. |
| **Zero dependencies** | One file, no runtime deps, no polyfills. Works in Node and every browser. |
| **TypeScript** | Default export, signature `(...segments: string[]) => string`. |

---

## Installation

```sh
npm install @mongez/concat-route
```

```sh
yarn add @mongez/concat-route
```

```sh
pnpm add @mongez/concat-route
```

---

## Quick start

```ts
import concatRoute from "@mongez/concat-route";

concatRoute("/api", "v1", "users", String(userId));
// "/api/v1/users/42"

concatRoute();                                       // "/"
concatRoute("");                                     // "/"
concatRoute("/");                                    // "/"
concatRoute("/", "home");                            // "/home"
concatRoute("/", "home", "", null, undefined, "/");  // "/home"
concatRoute("/", "home", "/welcome/");               // "/home/welcome"
concatRoute("/", "home", "////");                    // "/home"
concatRoute("/", "home", "///welcome///", "again");  // "/home/welcome/again"
```

That's the entire happy path. Everything below is depth on the same one function.

---

## The `concatRoute` function

`concatRoute(...segments: string[]): string` is the single export. It runs five normalization passes in order:

1. **Filter falsy.** Each segment passes `value && String(value).length > 0`. Removes `""`, `null`, `undefined`, `0`, and `false`.
2. **Strip the outer slash of each segment.** Anchored to `^` and `$`, so one strip per side — `"///foo///"` becomes `"//foo//"`.
3. **Prefix every survivor with `/`, join with no separator.** `["foo", "bar"]` becomes `"/foo/bar"`.
4. **Collapse runs of `/`.** Flattens any embedded doubles left over from step 2 or already in the input.
5. **Strip outer slashes once more, prepend a single `/`.** Guarantees the final shape.

### Return contract

- Always returns a `string`.
- Result is always non-empty.
- Result always starts with `/`.
- Result never ends with `/` **except** when it IS `"/"` (the root).

### Behaviour table

| Call | Result | Note |
|---|---|---|
| `concatRoute()` | `"/"` | Empty input collapses to the root. |
| `concatRoute("")` | `"/"` | Empty string filtered. |
| `concatRoute("/")` | `"/"` | Slash-only collapses to root. |
| `concatRoute("/", "/")` | `"/"` | Multiple slashes collapse. |
| `concatRoute("foo")` | `"/foo"` | Leading slash added. |
| `concatRoute("/foo/")` | `"/foo"` | Outer slashes stripped. |
| `concatRoute("foo", "bar")` | `"/foo/bar"` | Joined with `/`. |
| `concatRoute("/", "home")` | `"/home"` | Slash segment collapses. |
| `concatRoute("///foo///", "bar")` | `"/foo/bar"` | Multi-slash padding collapsed. |
| `concatRoute("a/b", "c")` | `"/a/b/c"` | Embedded `/` preserved. |
| `concatRoute("a//b", "c")` | `"/a/b/c"` | Embedded `//` collapsed. |
| `concatRoute("/", "home", "", null, undefined)` | `"/home"` | Mixed falsy filtered. |
| `concatRoute("a", 0 as any, "b")` | `"/a/b"` | `0` is falsy under the runtime filter. |
| `concatRoute("0")` | `"/0"` | The string `"0"` has length 1 — kept. |
| `concatRoute("/Users")` | `"/Users"` | Case preserved. |
| `concatRoute("café", "naïve")` | `"/café/naïve"` | Unicode preserved. |

### Things `concatRoute` does NOT do

- It does **not** collapse `.` or `..` segments — `concatRoute(".", "..")` returns `"/./.."`.
- It does **not** trim whitespace — `concatRoute(" ")` returns `"/ "`.
- It does **not** decode percent-encoded sequences — `%2F` stays `%2F`.
- It does **not** parse query strings or hash fragments — see the warnings below.
- It does **not** handle absolute URLs with a protocol — see the warnings below.

> **Do NOT pass query strings or hash fragments as segments.** They get wrapped in a leading `/`. `concatRoute("/home", "?q=1")` returns `"/home/?q=1"`. Build the path first, then append the query yourself: `` `${concatRoute("/search")}?q=${encodeURIComponent(q)}` ``.

> **Do NOT pass absolute URLs.** The slash-collapse pass turns `https://` into `https:/`. `concatRoute("https://example.com", "/api")` returns `"/https:/example.com/api"`. Use the platform `URL` instead: `new URL(concatRoute("/api", "v1"), "https://example.com")`.

---

## Recipes

### Build an API URL from a base path

Reach for this when every helper in a service file shares the same base and you don't want to repeat the prefix at every call site.

```ts
import concatRoute from "@mongez/concat-route";

const API_BASE = "/api/v1";

function userUrl(id: string | number) {
  return concatRoute(API_BASE, "users", String(id));
}

function postCommentsUrl(postId: string | number) {
  return concatRoute(API_BASE, "posts", String(postId), "comments");
}

userUrl(42);            // "/api/v1/users/42"
userUrl("me");          // "/api/v1/users/me"
postCommentsUrl(7);     // "/api/v1/posts/7/comments"
```

`API_BASE` can be `"/api/v1"`, `"/api/v1/"`, `"api/v1"`, or `""` — every form normalizes to the same output.

### Build a locale-prefixed URL

Reach for this when the locale is sometimes present and sometimes not (the default language has no prefix, every other language does). The falsy-filter pass lets one code path handle both.

```ts
import concatRoute from "@mongez/concat-route";

function route(locale: string | undefined | null, ...rest: string[]) {
  return concatRoute("/", locale ?? "", ...rest);
}

route("en", "products");         // "/en/products"
route("fr", "products", "42");   // "/fr/products/42"
route(undefined, "products");    // "/products"
route(null, "products");         // "/products"
route("", "products");           // "/products"
```

Same pattern works for tenant slugs, region codes, A/B-test buckets, or any other optional prefix segment.

### Normalize a user-configured base path

Reach for this when a config file or environment variable supplies a base path and you want one canonical form before storing or comparing.

```ts
import concatRoute from "@mongez/concat-route";

function normalizeBase(base: string | undefined): string {
  return concatRoute(base ?? "");
}

normalizeBase("/app/");    // "/app"
normalizeBase("app");      // "/app"
normalizeBase("/app");     // "/app"
normalizeBase("///app///");// "/app"
normalizeBase("");         // "/"
normalizeBase(undefined);  // "/"
```

Now downstream code can compare prefixes, derive sub-routes, and concatenate further segments without re-running validation on every read.

### Combine breadcrumbs into a path

Reach for this when the segments live in an array (a breadcrumb trail, a router match result, the keys of a nested object you're rendering).

```ts
import concatRoute from "@mongez/concat-route";

const crumbs = ["dashboard", "settings", "billing"];

concatRoute(...crumbs);
// "/dashboard/settings/billing"

// Prepend a base too:
concatRoute("/app", ...crumbs);
// "/app/dashboard/settings/billing"

// Empty array still returns a valid path:
concatRoute(...[]);
// "/"
```

### Build an absolute URL (path with `concatRoute`, origin with `URL`)

Reach for this when you need a fully-qualified URL. `concatRoute` mangles `https://` (the slash-collapse pass eats the second `/` of the protocol), so build the path-only part with `concatRoute` and hand it to the platform `URL`.

```ts
import concatRoute from "@mongez/concat-route";

const path = concatRoute("/api", "v1", "users", String(userId));
const url = new URL(path, "https://example.com").toString();
// "https://example.com/api/v1/users/42"
```

For URLs that also carry a query string, append it after the `URL` is built — or compose it with `@mongez/query-string` and pass the result to `URL.searchParams`.

---

## Related packages

| Package | Use when you need |
|---|---|
| [`@mongez/react-router`](https://github.com/hassanzohdy/mongez-react-router) | The router this helper feeds: base paths, lazy routes, locale prefixes, route pattern matching like `/users/:id`. |
| [`@mongez/query-string`](https://github.com/hassanzohdy/mongez-query-string) | Parse and stringify the `?a=1&b=2` portion of a URL. `concatRoute` is path-only — treat `"?q=1"` as a segment and it gets wrapped in `/`. |
| [`@mongez/localization`](https://github.com/hassanzohdy/mongez-localization) | Locale segments commonly prepended via `concatRoute("/", locale, ...)`. |

For the full single-file LLM-friendly reference, see [`llms-full.txt`](./llms-full.txt). For release history, see [`CHANGELOG.md`](./CHANGELOG.md).

---

## License

MIT

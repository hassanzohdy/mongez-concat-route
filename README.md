# @mongez/concat-route

> A tiny, dependency-free path joiner. Glue route segments into a single, normalized, leading-slash path — even when the inputs have stray slashes, empty strings, or `null` / `undefined`.

`concatRoute` is the function you reach for when you're composing URLs from configuration, base paths, and dynamic IDs and you don't want to think about whether the user gave you `"/users/"` or `"users"` or `""`.

```ts
import concatRoute from "@mongez/concat-route";

concatRoute("/api", "v1", "users", String(userId));
// "/api/v1/users/42"
```

## Install

```sh
yarn add @mongez/concat-route
# no runtime dependencies
```

## A 30-second tour

```ts
import concatRoute from "@mongez/concat-route";

concatRoute();                                       // "/"
concatRoute("");                                     // "/"
concatRoute("/");                                    // "/"
concatRoute("/", "home");                            // "/home"
concatRoute("/", "home", "", null, undefined, "/");  // "/home"
concatRoute("/", "home", "/welcome/");               // "/home/welcome"
concatRoute("/", "home", "/welcome/", "////");       // "/home/welcome"
concatRoute("/", "home", "///welcome///", "again");  // "/home/welcome/again"
concatRoute("api", "v1", "users", "42");             // "/api/v1/users/42"
```

## API

```ts
function concatRoute(...segments: string[]): string;
```

A variadic function that takes any number of path segments and returns a single normalized path. Every result begins with exactly one `/` and never ends with a trailing `/` (except for the empty result `"/"`).

### Normalization rules

1. **Falsy segments are dropped.** `""`, `null`, `undefined`, `0`, and `false` are filtered out. The runtime check is `value && String(value).length > 0`, so anything that coerces to a falsy primitive disappears before joining.
2. **Leading and trailing `/` on each segment are stripped.** `" /home/ "` (without the spaces) is treated as `"home"`.
3. **Runs of slashes inside the joined result are collapsed to a single `/`.** Embedded `//` from inside a single segment (`"a//b"`) gets collapsed too.
4. **The result always starts with `/`.** No matter what you put in.
5. **The result never ends with `/`** — except when the input collapses to nothing, in which case you get `"/"` (the root).

### Examples

```ts
concatRoute();                          // "/"             (empty input → root)
concatRoute("", "", "");                // "/"             (all falsy → root)
concatRoute("/");                       // "/"             (single root segment)
concatRoute("/", "/");                  // "/"             (slashes collapse)
concatRoute("foo");                     // "/foo"          (no leading slash added by caller)
concatRoute("/foo/");                   // "/foo"          (slashes stripped)
concatRoute("foo", "bar");              // "/foo/bar"      (joined with /)
concatRoute("/foo/", "/bar/");          // "/foo/bar"
concatRoute("a", "b", "c");             // "/a/b/c"
concatRoute("a/b", "c/d");              // "/a/b/c/d"      (embedded / preserved)
concatRoute("a//b", "c");               // "/a/b/c"        (embedded // collapsed)
```

## Edge cases

### Query strings and hash fragments

`concatRoute` is a **segment** joiner, not a URL parser. If you pass a query string or hash fragment as a segment, it is treated like any other segment — wrapped in `/`:

```ts
concatRoute("/home", "?q=1");      // "/home/?q=1"
concatRoute("/home", "#section");  // "/home/#section"
```

For URLs that include a query string or hash, build the path with `concatRoute` first, then concatenate the query/hash yourself:

```ts
const path = concatRoute("/api", "v1", "search");
const url = `${path}?q=${encodeURIComponent(query)}`;
```

### Absolute URLs

The function is designed for **relative path segments**, not full URLs. Passing an absolute URL with a `protocol://` works against the slash-collapsing pass:

```ts
concatRoute("https://example.com", "/api");
// "/https:/example.com/api"   <- the // after https: gets collapsed
```

Use `URL` (built-in) or a dedicated URL builder for that case.

### Non-string inputs

The TypeScript signature is `(...segments: string[]) => string`. At runtime, any falsy input (`0`, `false`, `null`, `undefined`, `""`) is filtered out before joining. Other non-strings are coerced via `String(...)`. Stay inside the type signature for predictable behavior.

## What this package does NOT do

- Parse or build query strings — use [`@mongez/query-string`](https://github.com/hassanzohdy/mongez-query-string).
- Encode/decode URL components — use the built-in `encodeURIComponent`.
- Handle absolute URLs or origins — use the platform `URL`.
- Generate route patterns or match params — use [`@mongez/react-router`](https://github.com/hassanzohdy/mongez-react-router).

## Related packages

| Package | Purpose |
|---|---|
| [`@mongez/react-router`](https://github.com/hassanzohdy/mongez-react-router) | The router this helper feeds: base paths, lazy routes, locale prefixes. |
| [`@mongez/query-string`](https://github.com/hassanzohdy/mongez-query-string) | Parse and stringify URL query parameters. |
| [`@mongez/localization`](https://github.com/hassanzohdy/mongez-localization) | Locale segments commonly prepended via `concatRoute("/", locale, ...)`. |

## License

MIT

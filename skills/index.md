---
description: "Join route or URL-path segments into one normalized, leading-slash path with @mongez/concat-route. Use for composing API endpoints, application routes, locale prefixes, configured base paths, and breadcrumb-like segment arrays without manual slash handling. 80% path: read overview for the boundary and contract, use concat-route for signature, normalization, dot segments, and edge cases, then copy recipes for common application patterns. Not this package → query-string encoding, parsing, or mutation: @mongez/query-string; absolute URLs, origins, or protocol handling: the platform URL API; route matching, params, or navigation: your router."
---

# @mongez/concat-route

`@mongez/concat-route` is a small, dependency-free path joiner. It turns string segments into a normalized path that always begins with `/`.

## The 80% path

1. Read [overview](overview/) to confirm this is a path-composition problem, not URL or router work.
2. Use [concat-route](concat-route/) for the import, return contract, slash and dot-segment behavior, and boundaries.
3. Adapt a working pattern from [recipes](recipes/) for API paths, optional locale prefixes, base paths, queries, or absolute URLs.

## Other topics

- [overview](overview/) explains the package model, guarantees, and scope boundaries.
- [concat-route](concat-route/) is the complete function reference and edge-case guide.
- [recipes](recipes/) collects copy-ready composition patterns.

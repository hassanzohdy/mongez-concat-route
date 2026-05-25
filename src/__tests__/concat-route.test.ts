import { describe, expect, it } from "vitest";
import concatRoute from "../index";

describe("concatRoute — empty / root cases", () => {
  it("returns '/' when called with no arguments", () => {
    expect(concatRoute()).toBe("/");
  });

  it("returns '/' when called with a single empty string", () => {
    expect(concatRoute("")).toBe("/");
  });

  it("returns '/' when called with multiple empty strings", () => {
    expect(concatRoute("", "", "")).toBe("/");
  });

  it("returns '/' when called with a single '/' segment", () => {
    expect(concatRoute("/")).toBe("/");
  });

  it("returns '/' when called with multiple '/' segments", () => {
    expect(concatRoute("/", "/", "/")).toBe("/");
  });

  it("returns '/' when called with only nullish-coerced values", () => {
    // Function signature is `string[]`, but the runtime filter uses
    // truthiness — null/undefined are dropped.
    expect(concatRoute(null as unknown as string)).toBe("/");
    expect(concatRoute(undefined as unknown as string)).toBe("/");
    expect(
      concatRoute(
        null as unknown as string,
        undefined as unknown as string,
        "",
      ),
    ).toBe("/");
  });
});

describe("concatRoute — single-segment normalization", () => {
  it("prepends a leading slash when missing", () => {
    expect(concatRoute("home")).toBe("/home");
  });

  it("strips a leading slash before re-adding one", () => {
    expect(concatRoute("/home")).toBe("/home");
  });

  it("strips a trailing slash", () => {
    expect(concatRoute("home/")).toBe("/home");
  });

  it("strips both leading and trailing slashes", () => {
    expect(concatRoute("/home/")).toBe("/home");
  });

  it("collapses multi-slash padding around a single segment", () => {
    expect(concatRoute("///home///")).toBe("/home");
  });

  it("preserves an embedded slash inside a single segment", () => {
    expect(concatRoute("a/b")).toBe("/a/b");
  });

  it("collapses an embedded run of slashes inside a single segment", () => {
    expect(concatRoute("a//b")).toBe("/a/b");
    expect(concatRoute("a///b")).toBe("/a/b");
  });
});

describe("concatRoute — multi-segment joining", () => {
  it("joins two segments with a single slash", () => {
    expect(concatRoute("a", "b")).toBe("/a/b");
  });

  it("joins three segments with single slashes", () => {
    expect(concatRoute("a", "b", "c")).toBe("/a/b/c");
  });

  it("absorbs leading slashes on later segments", () => {
    expect(concatRoute("a", "/b")).toBe("/a/b");
    expect(concatRoute("a", "/b", "/c")).toBe("/a/b/c");
  });

  it("absorbs trailing slashes on earlier segments", () => {
    expect(concatRoute("a/", "b")).toBe("/a/b");
    expect(concatRoute("a/", "b/", "c")).toBe("/a/b/c");
  });

  it("absorbs slashes on both sides simultaneously", () => {
    expect(concatRoute("/a/", "/b/", "/c/")).toBe("/a/b/c");
  });

  it("absorbs multi-slash padding between segments", () => {
    expect(concatRoute("a", "////", "b")).toBe("/a/b");
    expect(concatRoute("a///", "///b")).toBe("/a/b");
  });

  it("matches the README example precisely", () => {
    expect(concatRoute("/", "home", "///welcome///", "////", "again")).toBe(
      "/home/welcome/again",
    );
  });
});

describe("concatRoute — falsy filtering", () => {
  it("drops empty-string segments interleaved with real segments", () => {
    expect(concatRoute("a", "", "b")).toBe("/a/b");
  });

  it("drops null and undefined interleaved with real segments", () => {
    expect(
      concatRoute(
        "a",
        null as unknown as string,
        "b",
        undefined as unknown as string,
        "c",
      ),
    ).toBe("/a/b/c");
  });

  it("matches the README mixed-falsy example", () => {
    expect(
      concatRoute(
        "/",
        "home",
        "",
        null as unknown as string,
        undefined as unknown as string,
        "/",
      ),
    ).toBe("/home");
  });

  it("drops 0 because it is falsy under the runtime filter", () => {
    // The TypeScript signature is `string[]`, but the runtime filter is
    // `value && String(value).length > 0` which treats `0` as falsy.
    expect(concatRoute(0 as unknown as string)).toBe("/");
    expect(concatRoute("a", 0 as unknown as string, "b")).toBe("/a/b");
  });

  it("drops false because it is falsy under the runtime filter", () => {
    expect(concatRoute(false as unknown as string)).toBe("/");
    expect(concatRoute("a", false as unknown as string, "b")).toBe("/a/b");
  });

  it("keeps the string '0' because its length is > 0", () => {
    // The string "0" is truthy in JS, and its length is 1.
    expect(concatRoute("0")).toBe("/0");
    expect(concatRoute("users", "0")).toBe("/users/0");
  });
});

describe("concatRoute — return contract", () => {
  it("always returns a string", () => {
    expect(typeof concatRoute()).toBe("string");
    expect(typeof concatRoute("foo")).toBe("string");
    expect(typeof concatRoute("a", "b", "c")).toBe("string");
  });

  it("always starts with exactly one '/'", () => {
    const inputs: string[][] = [
      [],
      [""],
      ["/"],
      ["foo"],
      ["/foo/"],
      ["foo", "bar"],
      ["////foo////", "////bar////"],
    ];
    for (const args of inputs) {
      const result = concatRoute(...args);
      expect(result.startsWith("/")).toBe(true);
      expect(result.startsWith("//")).toBe(false);
    }
  });

  it("never ends with '/' except when the result IS '/'", () => {
    const samples = [
      concatRoute("foo"),
      concatRoute("/foo/"),
      concatRoute("a", "b", "c"),
      concatRoute("/a/", "/b/"),
    ];
    for (const result of samples) {
      expect(result.endsWith("/")).toBe(false);
    }
    // The one allowed trailing slash:
    expect(concatRoute()).toBe("/");
    expect(concatRoute("")).toBe("/");
  });

  it("collapses any run of internal slashes to a single slash", () => {
    // Build a path with deliberate redundant slashes inside and across
    // segments. The final result must contain no "//".
    const result = concatRoute("//a///", "////b//", "///c");
    expect(result).toBe("/a/b/c");
    expect(result.includes("//")).toBe(false);
  });
});

describe("concatRoute — preserved characters", () => {
  it("does NOT lowercase or case-fold segments", () => {
    expect(concatRoute("/API", "Users")).toBe("/API/Users");
  });

  it("does NOT trim whitespace inside segments", () => {
    // The internal `trim()` only handles leading/trailing slashes, not
    // whitespace. A space-only segment is truthy and its length is 1.
    expect(concatRoute(" ")).toBe("/ ");
    expect(concatRoute("a ", " b")).toBe("/a / b");
  });

  it("does NOT collapse dot segments", () => {
    expect(concatRoute(".", "..")).toBe("/./..");
    expect(concatRoute("a", ".", "b")).toBe("/a/./b");
  });

  it("does NOT decode percent-encoded sequences", () => {
    expect(concatRoute("users", "alice%20smith")).toBe("/users/alice%20smith");
    // Encoded slashes stay encoded.
    expect(concatRoute("users", "a%2Fb")).toBe("/users/a%2Fb");
  });

  it("does NOT alter unicode characters", () => {
    expect(concatRoute("café", "naïve")).toBe("/café/naïve");
  });
});

describe("concatRoute — query strings and hash fragments", () => {
  // These document the CURRENT segment-only behavior. A query string or
  // hash fragment passed as a segment is wrapped in a leading slash, just
  // like any other segment. This is documented in the README.
  it("treats a query-string segment as a path segment (adds leading slash)", () => {
    expect(concatRoute("/home", "?q=1")).toBe("/home/?q=1");
    expect(concatRoute("api", "v1", "?page=2")).toBe("/api/v1/?page=2");
  });

  it("treats a hash-fragment segment as a path segment (adds leading slash)", () => {
    expect(concatRoute("/home", "#section")).toBe("/home/#section");
  });

  it("a hash containing slashes still gets its outer slashes managed", () => {
    expect(concatRoute("/page", "#a/b")).toBe("/page/#a/b");
  });
});

describe("concatRoute — typical app routes", () => {
  it("builds an API URL from a base + resource + id", () => {
    expect(concatRoute("/api/v1", "users", "42")).toBe("/api/v1/users/42");
  });

  it("builds a sub-resource path", () => {
    expect(concatRoute("/api", "v1", "posts", "7", "comments")).toBe(
      "/api/v1/posts/7/comments",
    );
  });

  it("normalizes user-configured base paths to a single form", () => {
    expect(concatRoute("/app/")).toBe("/app");
    expect(concatRoute("app")).toBe("/app");
    expect(concatRoute("/app")).toBe("/app");
    expect(concatRoute("app/")).toBe("/app");
  });

  it("supports a locale-prefix pattern with an optional locale", () => {
    const route = (locale: string | undefined, ...rest: string[]) =>
      concatRoute("/", locale ?? "", ...rest);

    expect(route("en", "products")).toBe("/en/products");
    expect(route(undefined, "products")).toBe("/products");
    expect(route("", "products")).toBe("/products");
  });

  it("supports spreading a breadcrumb array", () => {
    const crumbs = ["dashboard", "settings", "billing"];
    expect(concatRoute(...crumbs)).toBe("/dashboard/settings/billing");
  });
});

describe("concatRoute — known quirks (documented, not fixed)", () => {
  // These tests demonstrate edge cases that are awkward but consistent
  // with the function's segment-only design. They are NOT bugs in the
  // sense that the function is doing what it says it does — they are
  // limitations of treating a URL like a flat list of path segments.

  it.skip("absolute URLs lose the second slash of the protocol (src/index.ts:17)", () => {
    // Step 4 of normalization runs `.replace(/(\/)+/g, "/")` over the
    // entire joined string. That collapses the `//` in `https://example.com`
    // to `/`, producing "/https:/example.com/api". The function is
    // path-only by design; for absolute URLs the caller should use the
    // platform `URL` object. Documented in skills/concat-route.md.
    expect(concatRoute("https://example.com", "/api")).toBe(
      "https://example.com/api",
    );
  });

  it.skip("query strings get a stray leading slash (src/index.ts:14)", () => {
    // Step 3 prefixes every surviving segment with `/`. A query string
    // like "?q=1" is just a segment to this function, so it becomes
    // "/home/?q=1". Most routers tolerate or strip the extra slash, but
    // semantically it changes the path. Callers should build the path
    // first and append the query string themselves.
    expect(concatRoute("/home", "?q=1")).toBe("/home?q=1");
  });

  it.skip("hash fragments get a stray leading slash (src/index.ts:14)", () => {
    // Same root cause as the query-string case.
    expect(concatRoute("/home", "#section")).toBe("/home#section");
  });
});

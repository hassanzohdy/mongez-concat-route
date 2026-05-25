import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Resolve sibling `@mongez/*` packages from the local monorepo when their
 * source folders exist, otherwise let Vite fall back to `node_modules`.
 *
 * `@mongez/concat-route` has no runtime dependencies, so the candidates
 * map is empty in practice. The pattern is mirrored from sibling packages
 * so this file looks/behaves identically across the workspace and so
 * future sibling deps can be added in one obvious place.
 */
function localSiblingAliases(): Record<string, string> {
  const candidates: Record<string, string> = {
    // (none — concat-route has no @mongez/* runtime dependencies)
  };
  const aliases: Record<string, string> = {};
  for (const [pkg, rel] of Object.entries(candidates)) {
    const abs = path.resolve(__dirname, rel);
    if (fs.existsSync(abs)) aliases[pkg] = abs;
  }
  return aliases;
}

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: localSiblingAliases(),
  },
});

function trim(text: string): string {
  return String(text).replace(/^\/|\/$/g, "");
}

/**
 * Resolve `.` and `..` segments so the joined path can never escape its
 * base path (`..` beyond the root is dropped instead of climbing above it).
 */
function resolveDotSegments(path: string): string {
  const resolved: string[] = [];

  for (const part of path.split("/")) {
    if (!part || part === ".") continue;

    if (part === "..") {
      resolved.pop();
      continue;
    }

    resolved.push(part);
  }

  return resolved.join("/");
}

/**
 * Concatenate the given paths to one single path
 *
 * @param   {...string} segments
 * @returns {string}
 */
export default function concatRoute(...segments: string[]) {
  let path: string = segments
    .filter((value) => value && String(value).length > 0)
    .map((segment) => "/" + trim(segment))
    .join("");

  return "/" + resolveDotSegments(trim(path.replace(/(\/)+/g, "/")));
}

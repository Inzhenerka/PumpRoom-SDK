/** Supported SCORM run-time versions. */
export type ScormVersion = "1.2" | "2004";

const methods = {
  "1.2": [
    "LMSInitialize",
    "LMSFinish",
    "LMSGetValue",
    "LMSSetValue",
    "LMSCommit",
    "LMSGetLastError",
    "LMSGetErrorString",
  ],
  "2004": [
    "Initialize",
    "Terminate",
    "GetValue",
    "SetValue",
    "Commit",
    "GetLastError",
    "GetErrorString",
  ],
} as const;

/** @internal */
export type ScormApi = Record<string, (...args: string[]) => unknown>;

/** @internal */
export function discoverApi(
  start: Window,
  version?: ScormVersion,
): { api: ScormApi; version: ScormVersion } | null {
  const queue: Window[] = [start];
  const visited = new Set<Window>();
  for (let i = 0; i < queue.length && i < 100; i++) {
    const current = queue[i];
    if (visited.has(current)) continue;
    visited.add(current);
    for (const candidate of version ? [version] : (["2004", "1.2"] as const)) {
      try {
        const api = (current as unknown as Record<string, unknown>)[
          candidate === "2004" ? "API_1484_11" : "API"
        ];
        if (
          api &&
          methods[candidate].every((key) => typeof (api as ScormApi)[key] === "function")
        ) {
          return { api: api as ScormApi, version: candidate };
        }
      } catch {
        // A cross-origin ancestor cannot expose its SCORM API directly.
      }
    }
    for (const key of ["parent", "opener"] as const) {
      try {
        const next = current[key] as Window | null;
        if (next && !visited.has(next)) queue.push(next);
      } catch {
        // Continue through other accessible windows, including the opener.
      }
    }
  }
  return null;
}

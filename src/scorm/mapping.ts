import type { TaskResult } from "../types/index.ts";
import type { ScormVersion } from "./discovery.ts";

/** @internal */
export function mapResult(result: TaskResult, version: ScormVersion): [string, string][] {
  if (
    ["not_attempted", "incomplete", "completed"].indexOf(result.completion_status) === -1 ||
    ["unknown", "passed", "failed"].indexOf(result.success_status) === -1 ||
    !Number.isSafeInteger(result.revision) ||
    result.revision < 0 ||
    (result.score !== null &&
      (!Number.isFinite(result.score) || result.score < 0 || result.score > 100)) ||
    (result.progress !== null &&
      (!Number.isFinite(result.progress) || result.progress < 0 || result.progress > 1))
  )
    throw new Error("Invalid PumpRoom task result");

  const values: [string, string][] = [];
  const prefix = version === "1.2" ? "cmi.core" : "cmi";
  if (result.score !== null) {
    values.push(
      [`${prefix}.score.min`, "0"],
      [`${prefix}.score.max`, "100"],
      [`${prefix}.score.raw`, String(result.score)],
    );
    if (version === "2004") values.push(["cmi.score.scaled", String(result.score / 100)]);
  }
  if (version === "2004") {
    if (result.progress !== null) values.push(["cmi.progress_measure", String(result.progress)]);
    values.push([
      "cmi.completion_status",
      result.completion_status === "not_attempted" ? "not attempted" : result.completion_status,
    ]);
    values.push(["cmi.success_status", result.success_status]);
  } else {
    const status =
      result.completion_status === "not_attempted"
        ? "not attempted"
        : result.completion_status !== "completed"
          ? "incomplete"
          : result.success_status === "unknown"
            ? "completed"
            : result.success_status;
    values.push(["cmi.core.lesson_status", status]);
  }
  return values;
}

/** @internal */
export function formatSessionTime(milliseconds: number, version: ScormVersion): string {
  const centiseconds = Math.floor(Math.max(0, milliseconds) / 10);
  if (version === "2004") return `PT${centiseconds / 100}S`;
  const capped = Math.min(centiseconds, 3599999999);
  const pad = (n: number, width: number) => ("0".repeat(width) + n).slice(-width);
  return `${pad(Math.floor(capped / 360000), 4)}:${pad(Math.floor(capped / 6000) % 60, 2)}:${pad(Math.floor(capped / 100) % 60, 2)}.${pad(capped % 100, 2)}`;
}

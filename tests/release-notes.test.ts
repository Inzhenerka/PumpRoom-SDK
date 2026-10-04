import { describe, expect, it } from "vitest";

import { renderReleaseNotes } from "../releaseNotes.ts";

const notes = `# v2
## 2.4.0 — Tasks

- Use \`mountTask()\`.
- Read the [guide](./docs/index.html).

# v1
## 1.0.0 — First release

Legacy integration.
`;

describe("release notes", () => {
  it("renders Markdown and collapses only previous major versions", () => {
    const root = document.createElement("div");
    root.innerHTML = renderReleaseNotes(notes, "2");
    expect(root.querySelector(":scope > h2")?.textContent).toBe("2.4.0 — Tasks");
    expect(root.querySelector("code")?.textContent).toBe("mountTask()");
    expect(root.querySelector("a")?.getAttribute("href")).toBe("./docs/index.html");
    expect(root.querySelectorAll("li")).toHaveLength(2);
    expect(root.querySelector("summary")?.textContent).toBe("История v1");
    expect(root.querySelector("details h2")?.textContent).toBe("1.0.0 — First release");
  });

  it("archives previous groups when the package moves to a new major", () => {
    const root = document.createElement("div");
    root.innerHTML = renderReleaseNotes(`# v3\n## 3.0.0 — New release\n\n${notes}`, "3");
    expect(root.querySelector(":scope > h2")?.textContent).toBe("3.0.0 — New release");
    expect(Array.from(root.querySelectorAll("summary"), (element) => element.textContent)).toEqual([
      "История v2",
      "История v1",
    ]);
  });

  it("does not execute HTML embedded in the Markdown", () => {
    const root = document.createElement("div");
    root.innerHTML = renderReleaseNotes('# v2\n\n<script>alert("test")</script>', "2");
    expect(root.querySelector("script")).toBeNull();
    expect(root.textContent).toContain("<script>");
  });

  it.each(["", "# Version history\n\n## 2.0.0"])(
    "rejects missing or malformed version groups",
    (source) => {
      expect(() => renderReleaseNotes(source, "2")).toThrow("# v<major>");
    },
  );
});

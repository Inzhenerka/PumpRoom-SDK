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

  it.each([0, 1, 5, 6, 8])("shows at most five current entries out of %i", (count) => {
    const entries = Array.from(
      { length: count },
      (_, index) =>
        `## 2.${count - index}.0 — Release ${index + 1}\n\nDescription ${index + 1}.\n\n- Use \`method${index + 1}()\`.\n`,
    ).join("\n");
    const root = document.createElement("div");
    root.innerHTML = renderReleaseNotes(
      `# v2\n\n${entries}\n# v1\n\n## 1.0.0 — Legacy\n\nOld notes.`,
      "2",
    );
    expect(root.querySelectorAll(":scope > h2")).toHaveLength(Math.min(count, 5));
    const archives = root.querySelectorAll(":scope > details");
    expect(archives).toHaveLength(count > 5 ? 2 : 1);
    if (count > 5) {
      expect(archives[0].querySelector("summary")?.textContent).toBe("Ранние изменения v2");
      expect(archives[0].hasAttribute("open")).toBe(false);
      expect(
        Array.from(archives[0].querySelectorAll("h2"), (heading) => heading.textContent),
      ).toEqual(
        Array.from(
          { length: count - 5 },
          (_, index) => `2.${count - index - 5}.0 — Release ${index + 6}`,
        ),
      );
      expect(archives[0].querySelector("code")?.textContent).toBe("method6()");
      expect(archives[0].textContent).toContain("Description 6.");
    }
    expect(archives[archives.length - 1].querySelector("summary")?.textContent).toBe("История v1");
    expect(root.querySelectorAll("h2")).toHaveLength(count + 1);
  });

  it("counts unreleased entries and preserves nested headings within an entry", () => {
    const root = document.createElement("div");
    root.innerHTML = renderReleaseNotes(
      `# v2

## Не выпущено

### Details

> ## Quoted heading

## 2.4.0

## 2.3.0

## 2.2.0

## 2.1.0

## 2.0.0

Oldest entry.
`,
      "2",
    );
    expect(
      Array.from(root.querySelectorAll(":scope > h2"), (heading) => heading.textContent),
    ).toEqual(["Не выпущено", "2.4.0", "2.3.0", "2.2.0", "2.1.0"]);
    expect(root.querySelector(":scope > h3")?.textContent).toBe("Details");
    expect(root.querySelector("blockquote h2")?.textContent).toBe("Quoted heading");
    expect(root.querySelector("details h2")?.textContent).toBe("2.0.0");
    expect(root.querySelector("details")?.textContent).toContain("Oldest entry.");
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

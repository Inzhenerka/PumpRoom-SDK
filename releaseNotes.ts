import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt();

/** Render the current major normally and keep previous majors in collapsible sections. */
export function renderReleaseNotes(source: string, currentMajor: string): string {
  const tokens = markdown.parse(source, {});
  const sections: { major: string; start: number; end: number }[] = [];
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].type !== "heading_open" || tokens[index].tag !== "h1") continue;
    const heading = tokens[index + 1]?.content;
    const match = /^v(\d+)$/.exec(heading ?? "");
    if (!match) throw new Error("Release notes groups must use # v<major> headings");
    if (sections.length) sections[sections.length - 1].end = index;
    sections.push({ major: match[1], start: index + 3, end: tokens.length });
  }
  if (!sections.length) throw new Error("Release notes must contain a # v<major> group");
  return sections
    .map(({ major, start, end }) => {
      const html = markdown.renderer.render(tokens.slice(start, end), markdown.options, {});
      return major === currentMajor
        ? html
        : `<details class="mt-3"><summary class="fw-semibold">История v${major}</summary>${html}</details>`;
    })
    .join("\n");
}

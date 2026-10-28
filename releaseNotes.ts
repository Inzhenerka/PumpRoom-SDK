import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt();

/** Show the five latest entries in the current major and collapse the remaining history. */
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
      const render = (from: number, to: number) =>
        markdown.renderer.render(tokens.slice(from, to), markdown.options, {});
      if (major !== currentMajor) {
        return `<details class="mt-3"><summary class="fw-semibold">История v${major}</summary>${render(start, end)}</details>`;
      }
      let entries = 0;
      for (let index = start; index < end; index++) {
        const token = tokens[index];
        if (token.type !== "heading_open" || token.tag !== "h2" || token.level !== 0) continue;
        if (++entries === 6) {
          return `${render(start, index)}<details class="mt-3"><summary class="fw-semibold">Ранние изменения v${major}</summary>${render(index, end)}</details>`;
        }
      }
      return render(start, end);
    })
    .join("\n");
}

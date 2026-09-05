import type { ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(!?\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const [full, , linkLabel, linkHref, bold, italic, code] = match;
    const key = `${keyPrefix}-${index++}`;
    if (full.startsWith("![")) {
      nodes.push(
        // Markdown preview: remote or data URLs, not a layout image.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key} src={linkHref} alt={linkLabel} className="my-2 max-h-48 rounded-md border object-cover" />
      );
    } else if (full.startsWith("[")) {
      nodes.push(
        <a
          key={key}
          href={linkHref}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {linkLabel}
        </a>
      );
    } else if (bold) {
      nodes.push(<strong key={key}>{bold}</strong>);
    } else if (italic) {
      nodes.push(<em key={key}>{italic}</em>);
    } else if (code) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {code}
        </code>
      );
    }
    last = match.index + full.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Small, safe subset: paragraphs, lists, emphasis, links and images. */
export function renderMarkdown(source: string): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length === 0) return;
    const items = list;
    list = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>{inline(item, `li-${blocks.length}-${index}`)}</li>
        ))}
      </ul>
    );
  };

  for (const line of lines) {
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag = heading[1].length === 1 ? "h3" : "h4";
      blocks.push(
        <Tag key={`h-${blocks.length}`} className="text-sm font-semibold">
          {inline(heading[2], `h-${blocks.length}`)}
        </Tag>
      );
      continue;
    }
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-relaxed">
        {inline(line, `p-${blocks.length}`)}
      </p>
    );
  }
  flushList();
  return <div className="space-y-2">{blocks}</div>;
}

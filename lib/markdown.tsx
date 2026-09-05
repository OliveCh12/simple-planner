import type { ReactNode } from "react";
import { Check } from "lucide-react";

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

interface ListItem {
  text: string;
  /** `undefined` for a plain bullet, otherwise the checkbox state. */
  checked?: boolean;
}

function parseListItem(raw: string): ListItem {
  const box = /^\[( |x|X)\]\s+(.*)$/.exec(raw);
  if (!box) return { text: raw };
  return { text: box[2], checked: box[1] !== " " };
}

/** Small, safe subset: paragraphs, headings, lists, task lists, emphasis, links and images. */
export function renderMarkdown(source: string): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: ListItem[] = [];
  const flushList = () => {
    if (list.length === 0) return;
    const items = list;
    list = [];
    const tasks = items.every((item) => item.checked !== undefined);
    blocks.push(
      <ul key={`ul-${blocks.length}`} className={tasks ? "space-y-1" : "list-disc space-y-1 pl-5"}>
        {items.map((item, index) =>
          item.checked === undefined ? (
            <li key={index}>{inline(item.text, `li-${blocks.length}-${index}`)}</li>
          ) : (
            <li key={index} className="flex items-start gap-2">
              <span
                aria-hidden
                className={
                  item.checked
                    ? "mt-[3px] flex size-3.5 shrink-0 items-center justify-center rounded-[3px] bg-foreground text-background"
                    : "mt-[3px] size-3.5 shrink-0 rounded-[3px] border border-foreground/40"
                }
              >
                {item.checked && <Check className="size-2.5" strokeWidth={3} />}
              </span>
              <span className={item.checked ? "text-muted-foreground line-through" : undefined}>
                {inline(item.text, `li-${blocks.length}-${index}`)}
              </span>
              <span className="sr-only">{item.checked ? "done" : "to do"}</span>
            </li>
          )
        )}
      </ul>
    );
  };

  for (const line of lines) {
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      list.push(parseListItem(bullet[1]));
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag = heading[1].length === 1 ? "h3" : "h4";
      blocks.push(
        <Tag key={`h-${blocks.length}`} className="pt-1 text-sm font-semibold">
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

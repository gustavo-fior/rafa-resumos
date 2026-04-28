import { ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
const BLOCK_PATTERN = /<(callout|columns|details)([^>]*)>([\s\S]*?)<\/\1>/gi;
const ATTR_PATTERN = /([a-z_-]+)\s*=\s*["']([^"']*)["']/gi;
const COLUMN_PATTERN = /<column\b[^>]*>([\s\S]*?)<\/column>/gi;
const SUMMARY_PATTERN = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i;
const EMPTY_BLOCK_PATTERN = /<empty-block\s*\/>|<empty-block\s*>\s*<\/empty-block\s*>/gi;
const UNDERLINE_SPAN_PATTERN = /<span\s+underline\s*=\s*["']?true["']?\s*>([\s\S]*?)<\/span>/gi;
const COLOR_SPAN_PATTERN = /<span\s+color\s*=\s*["']([^"']+)["']\s*>([\s\S]*?)<\/span>/gi;
const TOGGLE_ATTR_PATTERN = /\s*\{toggle\s*=\s*["']true["']\s*\}\s*/i;
const NOTION_ATTR_PATTERN = /\s*\{[a-z_-]+\s*=\s*["'][^"']*["']\}/gi;
const NOTION_COLORS = {
    blue: "#0b6e99",
    brown: "#64473a",
    gray: "#9b9a97",
    green: "#0f7b6c",
    orange: "#d9730d",
    pink: "#ad1a72",
    purple: "#6940a5",
    red: "#e03e3e",
    yellow: "#dfab01",
};
const NOTION_BG_COLORS = {
    blue_bg: "#ddebf1",
    brown_bg: "#e9e5e3",
    default: "#f1f1ef",
    gray_bg: "#f1f1ef",
    green_bg: "#ddedea",
    orange_bg: "#faebdd",
    pink_bg: "#f4dfeb",
    purple_bg: "#eae4f2",
    red_bg: "#fbe4e4",
    yellow_bg: "#fbf3db",
};
function parseAttrs(raw) {
    const attrs = {};
    let match = null;
    ATTR_PATTERN.lastIndex = 0;
    while ((match = ATTR_PATTERN.exec(raw)) !== null) {
        const [, key, value] = match;
        if (key)
            attrs[key.toLowerCase()] = value ?? "";
    }
    return attrs;
}
function convertToggles(content) {
    const lines = content.split("\n");
    const result = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!TOGGLE_ATTR_PATTERN.test(line)) {
            result.push(line);
            i++;
            continue;
        }
        const cleaned = line.replace(TOGGLE_ATTR_PATTERN, "").trim();
        const headingMatch = cleaned.match(/^#+\s+(.*)$/);
        const listMatch = cleaned.match(/^[-*]\s+(.*)$/);
        const summary = (headingMatch?.[1] ?? listMatch?.[1] ?? cleaned).trim();
        const bodyLines = [];
        let j = i + 1;
        while (j < lines.length) {
            const next = lines[j];
            if (next.trim() === "") {
                bodyLines.push("");
                j++;
                continue;
            }
            if (/^[\t ]+/.test(next)) {
                bodyLines.push(next);
                j++;
                continue;
            }
            break;
        }
        while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === "") {
            bodyLines.pop();
        }
        let minIndent = Number.POSITIVE_INFINITY;
        for (const bl of bodyLines) {
            if (!bl.trim())
                continue;
            const indent = bl.match(/^[\t ]*/)?.[0].length ?? 0;
            if (indent < minIndent)
                minIndent = indent;
        }
        const base = Number.isFinite(minIndent) ? minIndent : 0;
        const body = bodyLines.map((bl) => (bl.trim() === "" ? "" : bl.slice(base)));
        result.push("<details>");
        result.push(`<summary>${summary}</summary>`);
        result.push("");
        for (const bl of body)
            result.push(bl);
        result.push("");
        result.push("</details>");
        result.push("");
        i = j;
    }
    return result.join("\n");
}
function preprocessNotionMarkdown(content) {
    const withConversions = content
        .replace(EMPTY_BLOCK_PATTERN, "\n\n")
        .replace(UNDERLINE_SPAN_PATTERN, "<u>$1</u>")
        .replace(COLOR_SPAN_PATTERN, (_match, color, inner) => {
        const hex = NOTION_COLORS[color.toLowerCase()];
        if (!hex)
            return inner;
        return `<span style="color:${hex}">${inner}</span>`;
    });
    return convertToggles(withConversions)
        .replace(NOTION_ATTR_PATTERN, "")
        .replace(/\n{3,}/g, "\n\n");
}
function dedent(text) {
    return text
        .split("\n")
        .map((line) => line.replace(/^[\t ]+/, ""))
        .join("\n");
}
function parseColumnContents(content) {
    const columns = [];
    let match = null;
    COLUMN_PATTERN.lastIndex = 0;
    while ((match = COLUMN_PATTERN.exec(content)) !== null) {
        const raw = match[1];
        if (!raw)
            continue;
        const dedented = dedent(raw).trim();
        if (dedented)
            columns.push(dedented);
    }
    return columns;
}
function parseMarkdownSegments(content) {
    const segments = [];
    let cursor = 0;
    let match = null;
    BLOCK_PATTERN.lastIndex = 0;
    while ((match = BLOCK_PATTERN.exec(content)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1]?.toLowerCase();
        const attrsRaw = match[2] ?? "";
        const innerContent = match[3] ?? "";
        const matchStart = match.index;
        const before = content.slice(cursor, matchStart).trim();
        if (before) {
            segments.push({ type: "markdown", content: before });
        }
        if (tagName === "columns") {
            const columns = parseColumnContents(innerContent);
            if (columns.length > 0) {
                segments.push({ type: "columns", columns });
            }
            else {
                segments.push({ type: "markdown", content: fullMatch });
            }
        }
        else if (tagName === "callout") {
            const dedented = dedent(innerContent).trim();
            if (dedented) {
                const attrs = parseAttrs(attrsRaw);
                segments.push({
                    type: "callout",
                    content: dedented,
                    icon: attrs.icon ?? null,
                    color: attrs.color ?? null,
                });
            }
        }
        else if (tagName === "details") {
            const summaryMatch = innerContent.match(SUMMARY_PATTERN);
            const summary = summaryMatch?.[1]?.trim() ?? "";
            const bodyRaw = summaryMatch
                ? innerContent.replace(SUMMARY_PATTERN, "")
                : innerContent;
            const body = dedent(bodyRaw).trim();
            segments.push({ type: "details", summary, content: body });
        }
        cursor = matchStart + fullMatch.length;
    }
    const remaining = content.slice(cursor).trim();
    if (remaining) {
        segments.push({ type: "markdown", content: remaining });
    }
    return segments;
}
function MarkdownBlock({ content }) {
    return (<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{
            a: ({ children, href, node: _node, ...props }) => (<a {...props} href={href} className="text-[#37352f] underline decoration-[#9b9a97] underline-offset-[3px] transition-colors hover:decoration-[#37352f]" rel="noreferrer" target="_blank">
            {children}
          </a>),
            h1: ({ children, node: _node, ...props }) => (<h1 {...props} className="mt-8 text-2xl font-semibold tracking-tight text-[#37352f]">
            {children}
          </h1>),
            h2: ({ children, node: _node, ...props }) => (<h2 {...props} className="mt-6 text-xl font-semibold tracking-tight text-[#37352f]">
            {children}
          </h2>),
            h3: ({ children, node: _node, ...props }) => (<h3 {...props} className="mt-5 text-lg font-semibold tracking-tight text-[#37352f]">
            {children}
          </h3>),
            h4: ({ children, node: _node, ...props }) => (<h4 {...props} className="mt-4 text-base font-semibold tracking-tight text-[#37352f]">
            {children}
          </h4>),
            details: ({ children, node: _node, ...props }) => (<details {...props} className="group my-4 rounded border border-[#ededec] bg-[#fbfbfa] p-4">
            {children}
          </details>),
            img: ({ alt, src }) => (<img alt={alt ?? ""} className="my-5 w-full rounded border border-[#ededec] object-cover" src={src ?? ""}/>),
            summary: ({ children, node: _node, ...props }) => (<summary {...props} className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[#37352f]">
            <ChevronRight className="size-4 shrink-0 text-[#787774] transition-transform duration-150 group-open:rotate-90" strokeWidth={2}/>
            <span className="flex-1">{children}</span>
          </summary>),
            table: ({ children, node: _node, ...props }) => (<div className="my-5 overflow-x-auto rounded border border-[#ededec]">
            <table {...props} className="w-full min-w-[34rem] border-collapse text-sm">
              {children}
            </table>
          </div>),
        }}>
      {content}
    </ReactMarkdown>);
}
function InlineMarkdown({ content }) {
    return (<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{
            p: ({ children }) => <>{children}</>,
        }}>
      {content}
    </ReactMarkdown>);
}
function MarkdownContent({ content }) {
    return parseMarkdownSegments(content).map((segment, index) => {
        if (segment.type === "markdown") {
            return <MarkdownBlock key={`markdown-${index}`} content={segment.content}/>;
        }
        if (segment.type === "callout") {
            const bg = segment.color
                ? NOTION_BG_COLORS[segment.color.toLowerCase()]
                : undefined;
            const calloutStyle = bg
                ? { backgroundColor: bg, borderColor: bg }
                : undefined;
            return (<div key={`callout-${index}`} className="my-5 flex gap-3 rounded border border-[#ededec] bg-[#fbfbfa] px-4 py-3" style={calloutStyle}>
          {segment.icon ? (<span aria-hidden className="shrink-0 select-none pt-0.5 text-base leading-6">
              {segment.icon}
            </span>) : null}
          <div className="min-w-0 flex-1">
            <MarkdownContent content={segment.content}/>
          </div>
        </div>);
        }
        if (segment.type === "details") {
            return (<details key={`details-${index}`} className="group my-4 rounded border border-[#ededec] bg-[#fbfbfa] p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[#37352f]">
            <ChevronRight className="size-4 shrink-0 text-[#787774] transition-transform duration-150 group-open:rotate-90" strokeWidth={2}/>
            <span className="flex-1">
              <InlineMarkdown content={segment.summary}/>
            </span>
          </summary>
          <div className="mt-3">
            <MarkdownContent content={segment.content}/>
          </div>
        </details>);
        }
        const style = {
            "--reader-column-count": String(segment.columns.length),
        };
        return (<div key={`columns-${index}`} className="reader-columns" style={style}>
        {segment.columns.map((columnContent, columnIndex) => (<div key={`column-${index}-${columnIndex}`} className="reader-column">
            <div className="reader-column-content">
              <MarkdownContent content={columnContent}/>
            </div>
          </div>))}
      </div>);
    });
}
export default function MarkdownRenderer({ content }) {
    const normalized = content ? preprocessNotionMarkdown(content) : "";
    return (<div className="reader-prose">
      {normalized ? <MarkdownContent content={normalized}/> : null}
    </div>);
}

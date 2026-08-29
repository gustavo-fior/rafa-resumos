import { createHash } from "node:crypto";
import { env } from "@rafa-resumos/env/r2";
import { S3Client } from "bun";

// Notion serves uploaded files through short-lived signed S3 URLs (~1h).
// During sync we copy every image into our own R2 bucket under a
// deterministic key and rewrite the markdown to point at the permanent URL.

const s3 = new S3Client({
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  bucket: env.R2_BUCKET,
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: "auto",
});

const NOTION_VERSION = "2026-03-11";
const NOTION_FILE_HOSTS = [
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "s3.us-west-2.amazonaws.com",
  "file.notion.so",
];
const CONCURRENCY = 6;
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

type NotionBlock = {
  type: string;
  [key: string]:
    | { file?: { url: string }; external?: { url: string } }
    | string
    | undefined;
};

function log(level: "info" | "warn", message: string, details?: unknown) {
  (level === "warn" ? console.warn : console.info)(
    `[sync:notion:assets] ${message}`,
    details ?? ""
  );
}

function isNotionFileUrl(url: string) {
  try {
    return NOTION_FILE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isAlreadyHosted(url: string) {
  return url.startsWith(`${env.R2_PUBLIC_URL}/`);
}

// The S3 path (`/<file-uuid>/<name>`) is stable across signatures, so it
// gives a key that survives re-syncs; only the query string changes.
function keyForNotionUrl(pageId: string, url: string, contentType: string) {
  const { pathname } = new URL(url);
  const hash = createHash("sha1").update(pathname).digest("hex").slice(0, 20);
  const ext =
    EXTENSION_BY_TYPE[contentType.split(";")[0]?.trim() ?? ""] ??
    pathname.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ??
    "bin";
  return `notion/${pageId}/${hash}.${ext}`;
}

// Notion's markdown export emits `file://{"source":"attachment:...","permissionRecord":{"id":<blockId>}}`
// for attachment blocks. The block API resolves those to a signed URL.
async function resolveAttachmentRef(ref: string) {
  if (!ref.startsWith("file://")) return null;

  try {
    const meta = JSON.parse(decodeURIComponent(ref.slice("file://".length))) as {
      permissionRecord?: { id?: string; table?: string };
    };
    const blockId = meta.permissionRecord?.id;
    if (!blockId) return null;

    const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
      },
    });
    if (!response.ok) return null;

    const block = (await response.json()) as NotionBlock;
    const payload = block[block.type];
    if (!payload || typeof payload === "string") return null;
    return payload.file?.url ?? payload.external?.url ?? null;
  } catch {
    return null;
  }
}

async function copyToBucket(pageId: string, sourceUrl: string) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`download failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const key = keyForNotionUrl(pageId, sourceUrl, contentType);
  const file = s3.file(key);

  if (!(await file.exists())) {
    const body = await response.arrayBuffer();
    await file.write(body, { type: contentType });
  } else {
    // Drain so the connection is released.
    await response.arrayBuffer().catch(() => undefined);
  }

  return `${env.R2_PUBLIC_URL}/${key}`;
}

async function rehostOne(pageId: string, ref: string): Promise<string | null> {
  let sourceUrl: string | null = ref;

  if (!ref.startsWith("http")) {
    sourceUrl = await resolveAttachmentRef(ref);
    if (!sourceUrl) {
      log("warn", "Could not resolve non-http image reference.", { pageId, ref: ref.slice(0, 120) });
      return null;
    }
  }

  if (isAlreadyHosted(sourceUrl) || !isNotionFileUrl(sourceUrl)) {
    return null;
  }

  try {
    return await copyToBucket(pageId, sourceUrl);
  } catch (error) {
    log("warn", "Could not rehost image; keeping the original URL.", {
      pageId,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return null;
  }
}

/**
 * Rewrites every Notion-hosted image in `markdown` to its permanent copy in R2.
 * Images that are already rehosted or hosted elsewhere are left untouched.
 */
export async function rehostMarkdownImages(pageId: string, markdown: string) {
  const refs = [...new Set([...markdown.matchAll(MARKDOWN_IMAGE_RE)].map((m) => m[2] as string))];
  if (refs.length === 0) return { markdown, rehosted: 0 };

  const replacements = new Map<string, string>();

  for (let i = 0; i < refs.length; i += CONCURRENCY) {
    await Promise.all(
      refs.slice(i, i + CONCURRENCY).map(async (ref) => {
        const hosted = await rehostOne(pageId, ref);
        if (hosted) replacements.set(ref, hosted);
      })
    );
  }

  if (replacements.size === 0) return { markdown, rehosted: 0 };

  const rewritten = markdown.replace(MARKDOWN_IMAGE_RE, (full, alt, ref, title) => {
    const hosted = replacements.get(ref);
    return hosted ? `![${alt}](${hosted}${title ?? ""})` : full;
  });

  return { markdown: rewritten, rehosted: replacements.size };
}

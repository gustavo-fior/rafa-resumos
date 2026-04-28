import { db } from "@rafa-resumos/db";
import { products, subjects, } from "@rafa-resumos/db/schema/app";
import { env } from "@rafa-resumos/env/notion";
import { and, eq, ne } from "drizzle-orm";
import { slugify } from "../lib/slug";
const NOTION_BASE_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";
const PROPERTY_ALIASES = {
    category: ["category", "categoria"],
    featured: ["featured", "destacado"],
    priceCents: [
        "price_cents",
        "preco_centavos",
        "preco (centavos)",
        "preco-centavos",
    ],
    seoDescription: [
        "seo_description",
        "seo description",
        "descricao seo",
        "seo",
    ],
    sortOrder: ["sort_order", "sort order", "ordem"],
    status: ["status"],
    subject: ["subject", "assunto"],
    title: ["name", "nome"],
};
const REQUIRED_FIELDS = ["category", "status", "subject", "title"];
const OPTIONAL_FIELDS = [
    "featured",
    "priceCents",
    "seoDescription",
    "sortOrder",
];
const FIELD_TYPES = {
    category: ["select"],
    featured: ["checkbox"],
    priceCents: ["number"],
    seoDescription: ["rich_text", "title"],
    sortOrder: ["number"],
    status: ["select"],
    subject: ["select"],
    title: ["title"],
};
function normalizePropertyName(value) {
    return slugify(value).replace(/-/g, "_");
}
function logSync(level, message, details) {
    const prefix = `[sync:notion] ${message}`;
    if (level === "error") {
        console.error(prefix, details ?? "");
        return;
    }
    if (level === "warn") {
        console.warn(prefix, details ?? "");
        return;
    }
    console.info(prefix, details ?? "");
}
async function notionRequest(path, init) {
    const response = await fetch(`${NOTION_BASE_URL}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${env.NOTION_API_KEY}`,
            "Content-Type": "application/json",
            "Notion-Version": NOTION_VERSION,
            ...init?.headers,
        },
    });
    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Notion request failed (${response.status} ${response.statusText}) for ${path}${details ? `: ${details}` : ""}`);
    }
    return (await response.json());
}
async function resolveDataSourceId(databaseId) {
    try {
        const response = await notionRequest(`/databases/${databaseId}`);
        const dataSourceId = response.data_sources?.[0]?.id;
        if (dataSourceId) {
            return dataSourceId;
        }
    }
    catch (error) {
        try {
            const dataSource = await notionRequest(`/data_sources/${databaseId}`);
            if (dataSource.id) {
                return dataSource.id;
            }
        }
        catch {
            throw new Error(`Could not access the Notion database "${databaseId}". Share the database with the "Rafa Resumos" integration before running sync.`);
        }
    }
    throw new Error(`The Notion database "${databaseId}" was found, but no child data source ID was returned.`);
}
function pickSchemaProperty(schemaProperties, field, required) {
    const aliases = PROPERTY_ALIASES[field].map(normalizePropertyName);
    const allowedTypes = FIELD_TYPES[field];
    const property = Object.values(schemaProperties).find((candidate) => {
        return (aliases.includes(normalizePropertyName(candidate.name)) &&
            allowedTypes.includes(candidate.type));
    });
    if (property) {
        return property.name;
    }
    if (!required) {
        return null;
    }
    const availableProperties = Object.values(schemaProperties)
        .map((candidate) => `${candidate.name} (${candidate.type})`)
        .join(", ");
    throw new Error(`The Notion data source is missing a compatible "${field}" property. Available properties: ${availableProperties}`);
}
function resolveFieldMap(dataSource) {
    const requiredFields = REQUIRED_FIELDS.reduce((map, field) => {
        map[field] = pickSchemaProperty(dataSource.properties, field, true);
        return map;
    }, {});
    const optionalFields = OPTIONAL_FIELDS.reduce((map, field) => {
        map[field] = pickSchemaProperty(dataSource.properties, field, false);
        return map;
    }, {});
    return {
        ...requiredFields,
        ...optionalFields,
    };
}
async function getDataSource(dataSourceId) {
    return notionRequest(`/data_sources/${dataSourceId}`);
}
async function queryAllPages(dataSourceId) {
    const pages = [];
    let nextCursor = null;
    do {
        const requestBody = {
            page_size: 100,
            in_trash: false,
            ...(nextCursor ? { start_cursor: nextCursor } : {}),
            result_type: "page",
        };
        const response = await notionRequest(`/data_sources/${dataSourceId}/query`, {
            method: "POST",
            body: JSON.stringify(requestBody),
        });
        pages.push(...response.results);
        nextCursor = response.has_more ? response.next_cursor : null;
    } while (nextCursor);
    return pages;
}
async function retrieveMarkdownTree(pageOrBlockId, visited = new Set()) {
    if (visited.has(pageOrBlockId)) {
        return "";
    }
    visited.add(pageOrBlockId);
    const response = await notionRequest(`/pages/${pageOrBlockId}/markdown`);
    let markdown = response.markdown ?? "";
    for (const unknownBlockId of response.unknown_block_ids ?? []) {
        try {
            const nestedMarkdown = await retrieveMarkdownTree(unknownBlockId, visited);
            if (nestedMarkdown.trim()) {
                markdown = `${markdown}\n\n${nestedMarkdown}`;
            }
        }
        catch (error) {
            logSync("warn", "Could not resolve unknown markdown block. Keeping the existing markdown snapshot.", {
                blockId: unknownBlockId,
                error: error instanceof Error ? error.message : "unknown error",
            });
        }
    }
    return normalizeMarkdown(markdown);
}
function normalizeMarkdown(markdown) {
    return markdown
        .replace(/<empty-block\s*\/>|<empty-block\s*>\s*<\/empty-block\s*>/gi, "\n\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
function getProperty(page, key) {
    return page.properties[key];
}
function getTitle(page, key) {
    const property = getProperty(page, key);
    return property?.type === "title"
        ? property.title
            .map((item) => item.plain_text)
            .join("")
            .trim()
        : "";
}
function getRichText(page, key) {
    const richTextProperty = getProperty(page, key);
    const titleProperty = getProperty(page, key);
    if (richTextProperty?.type === "rich_text") {
        return richTextProperty.rich_text
            .map((item) => item.plain_text)
            .join("")
            .trim();
    }
    if (titleProperty?.type === "title") {
        return titleProperty.title
            .map((item) => item.plain_text)
            .join("")
            .trim();
    }
    return "";
}
function getSelect(page, key) {
    const property = getProperty(page, key);
    return property?.type === "select" ? property.select?.name?.trim() ?? "" : "";
}
function getCheckbox(page, key) {
    const property = getProperty(page, key);
    return property?.type === "checkbox" ? property.checkbox : false;
}
function getNumber(page, key) {
    const property = getProperty(page, key);
    return property?.type === "number" ? property.number ?? 0 : 0;
}
async function fetchAsDataUri(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            logSync("warn", "Could not download icon for base64 conversion.", {
                status: response.status,
                url,
            });
            return null;
        }
        const contentType = response.headers.get("content-type") ?? "image/png";
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return `data:${contentType};base64,${base64}`;
    }
    catch (error) {
        logSync("warn", "Icon download threw an error. Skipping icon for this page.", {
            error: error instanceof Error ? error.message : "unknown error",
            url,
        });
        return null;
    }
}
async function parseIcon(icon) {
    if (!icon)
        return { iconEmoji: null, iconUrl: null };
    if (icon.type === "emoji")
        return { iconEmoji: icon.emoji, iconUrl: null };
    const sourceUrl = icon.type === "file"
        ? icon.file.url
        : icon.type === "external"
            ? icon.external.url
            : icon.custom_emoji.url;
    const dataUri = await fetchAsDataUri(sourceUrl);
    return { iconEmoji: null, iconUrl: dataUri };
}
function parseCategory(page, fieldMap) {
    const value = slugify(getSelect(page, fieldMap.category));
    return ["medicina", "utilidades"].includes(value) ? value : null;
}
function parseStatus(page, fieldMap) {
    const value = slugify(getSelect(page, fieldMap.status));
    return ["draft", "published", "archived"].includes(value) ? value : null;
}
async function generateUniqueSlug(title, notionPageId) {
    const base = slugify(title);
    if (!base)
        return null;
    let candidate = base;
    let suffix = 2;
    while (true) {
        const conflict = await db
            .select({ id: products.id })
            .from(products)
            .where(and(eq(products.slug, candidate), ne(products.notionPageId, notionPageId)))
            .limit(1)
            .then((result) => result[0]);
        if (!conflict)
            return candidate;
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
}
async function upsertSubject(name, sortOrder) {
    const slug = slugify(name);
    const existing = await db
        .select({
        id: subjects.id,
    })
        .from(subjects)
        .where(eq(subjects.slug, slug))
        .limit(1)
        .then((result) => result[0]);
    if (existing) {
        await db
            .update(subjects)
            .set({
            name,
            sortOrder,
            updatedAt: new Date(),
        })
            .where(eq(subjects.id, existing.id));
        return existing.id;
    }
    const inserted = await db
        .insert(subjects)
        .values({
        name,
        slug,
        sortOrder,
    })
        .returning({
        id: subjects.id,
    });
    return inserted[0]?.id;
}
export async function syncNotionProducts() {
    const dataSourceId = await resolveDataSourceId(env.NOTION_DATABASE_ID);
    const dataSource = await getDataSource(dataSourceId);
    const fieldMap = resolveFieldMap(dataSource);
    const pages = (await queryAllPages(dataSourceId)).sort((left, right) => {
        const leftSortOrder = fieldMap.sortOrder
            ? getNumber(left, fieldMap.sortOrder)
            : Number.MAX_SAFE_INTEGER;
        const rightSortOrder = fieldMap.sortOrder
            ? getNumber(right, fieldMap.sortOrder)
            : Number.MAX_SAFE_INTEGER;
        if (leftSortOrder !== rightSortOrder) {
            return leftSortOrder - rightSortOrder;
        }
        return getTitle(left, fieldMap.title).localeCompare(getTitle(right, fieldMap.title), "pt-BR");
    });
    let syncedCount = 0;
    logSync("info", "Resolved Notion field mapping.", fieldMap);
    for (const [index, page] of pages.entries()) {
        const title = getTitle(page, fieldMap.title);
        const subjectName = getSelect(page, fieldMap.subject);
        const category = parseCategory(page, fieldMap);
        const status = parseStatus(page, fieldMap);
        if (!title || !subjectName || !category || !status) {
            logSync("warn", "Skipping page with incomplete metadata.", {
                category,
                pageId: page.id,
                status,
                subjectName,
                title,
            });
            continue;
        }
        const subjectId = await upsertSubject(subjectName, index);
        if (!subjectId) {
            logSync("warn", "Skipping page because the subject could not be created.", {
                pageId: page.id,
                subjectName,
            });
            continue;
        }
        const existing = await db
            .select({
            id: products.id,
            slug: products.slug,
        })
            .from(products)
            .where(eq(products.notionPageId, page.id))
            .limit(1)
            .then((result) => result[0]);
        const slug = existing?.slug ?? (await generateUniqueSlug(title, page.id));
        if (!slug) {
            logSync("warn", "Skipping page because a slug could not be generated from the title.", {
                pageId: page.id,
                title,
            });
            continue;
        }
        const { iconEmoji, iconUrl } = await parseIcon(page.icon);
        const baseValues = {
            category,
            featured: fieldMap.featured
                ? getCheckbox(page, fieldMap.featured)
                : false,
            iconEmoji,
            iconUrl,
            notionLastEditedAt: page.last_edited_time
                ? new Date(page.last_edited_time)
                : null,
            notionPageId: page.id,
            priceCents: fieldMap.priceCents
                ? getNumber(page, fieldMap.priceCents)
                : 0,
            seoDescription: fieldMap.seoDescription
                ? getRichText(page, fieldMap.seoDescription) || null
                : null,
            slug,
            sortOrder: fieldMap.sortOrder
                ? getNumber(page, fieldMap.sortOrder)
                : index,
            status,
            subjectId,
            title,
            updatedAt: new Date(),
        };
        if (existing) {
            await db
                .update(products)
                .set(baseValues)
                .where(eq(products.id, existing.id));
        }
        else {
            await db.insert(products).values(baseValues);
        }
        try {
            const markdown = await retrieveMarkdownTree(page.id);
            if (!markdown.trim()) {
                logSync("warn", "Synced a page with an empty body.", {
                    pageId: page.id,
                    slug,
                    status,
                });
            }
            await db
                .update(products)
                .set({
                contentMarkdown: markdown,
                lastSyncedAt: new Date(),
                updatedAt: new Date(),
            })
                .where(eq(products.notionPageId, page.id));
            syncedCount += 1;
        }
        catch (error) {
            logSync("warn", "Markdown sync failed. Keeping the last good content snapshot.", {
                error: error instanceof Error ? error.message : "unknown error",
                pageId: page.id,
                slug,
            });
        }
    }
    logSync("info", "Finished syncing Notion content.", {
        processedPages: pages.length,
        syncedCount,
    });
    return {
        processedPages: pages.length,
        syncedCount,
    };
}

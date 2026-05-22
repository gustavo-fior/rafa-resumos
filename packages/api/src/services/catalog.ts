import { db } from "@rafa-resumos/db";
import {
  entitlements,
  products,
  subjects,
  type ProductCategory,
  productCategory,
} from "@rafa-resumos/db/schema/app";
import { and, asc, desc, eq, isNull } from "drizzle-orm";

export type CatalogFilters = {
  category?: ProductCategory;
  search?: string;
  subjectSlug?: string;
  excludeOwned?: boolean;
};

// Every column EXCEPT the per-user entitlement join. The catalog is identical
// for every visitor, so we fetch it once and keep it in memory; `hasAccess` is
// layered on afterwards from a tiny per-user entitlement lookup.
const productSelection = {
  id: products.id,
  notionPageId: products.notionPageId,
  slug: products.slug,
  title: products.title,
  seoDescription: products.seoDescription,
  category: products.category,
  iconEmoji: products.iconEmoji,
  iconUrl: products.iconUrl,
  featured: products.featured,
  sortOrder: products.sortOrder,
  status: products.status,
  priceCents: products.priceCents,
  contentMarkdown: products.contentMarkdown,
  notionLastEditedAt: products.notionLastEditedAt,
  lastSyncedAt: products.lastSyncedAt,
  subjectId: subjects.id,
  subjectName: subjects.name,
  subjectSlug: subjects.slug,
  subjectSortOrder: subjects.sortOrder,
} as const;

function mapCatalogRow(row: any) {
  return {
    id: row.id,
    notionPageId: row.notionPageId,
    slug: row.slug,
    title: row.title,
    seoDescription: row.seoDescription,
    category: row.category,
    iconEmoji: row.iconEmoji,
    iconUrl: row.iconUrl,
    featured: row.featured,
    sortOrder: row.sortOrder,
    status: row.status,
    priceCents: row.priceCents,
    contentMarkdown: row.contentMarkdown,
    notionLastEditedAt: row.notionLastEditedAt,
    lastSyncedAt: row.lastSyncedAt,
    hasAccess: false,
    subject: {
      id: row.subjectId,
      name: row.subjectName,
      slug: row.subjectSlug,
    },
  };
}

// ---------------------------------------------------------------------------
// In-memory catalog snapshot
//
// The published catalog only changes when an admin runs a Notion sync, so we
// cache the *entire* catalog (products + subjects) in process memory and serve
// every list/detail/subject/reader read from it. The database is only touched
// on a cold start, after `invalidateCatalogCache()`, or once the safety-net TTL
// elapses. This is what keeps Supabase egress flat regardless of traffic.
// ---------------------------------------------------------------------------

// Real freshness comes from invalidateCatalogCache() on every Notion sync.
// The TTL only exists so a missed invalidation can't serve stale data forever.
const SNAPSHOT_TTL_MS = 12 * 60 * 60 * 1000; // 12h

type SubjectSnapshot = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  categories: Set<ProductCategory>;
};

type Snapshot = {
  products: ReturnType<typeof mapCatalogRow>[];
  subjects: SubjectSnapshot[];
  fetchedAt: number;
};

let snapshot: Snapshot | null = null;
let inFlight: Promise<Snapshot> | null = null;
// Bumped by invalidateCatalogCache() so an in-flight load started before an
// invalidation can't overwrite the cache with data it knows is now stale.
let generation = 0;

async function loadSnapshot(): Promise<Snapshot> {
  const rows = await db
    .select(productSelection)
    .from(products)
    .innerJoin(subjects, eq(products.subjectId, subjects.id))
    .where(eq(products.status, "published" as const))
    .orderBy(
      desc(products.featured),
      asc(products.sortOrder),
      asc(products.title)
    );

  const subjectMap = new Map<string, SubjectSnapshot>();
  for (const row of rows) {
    let entry = subjectMap.get(row.subjectId);
    if (!entry) {
      entry = {
        id: row.subjectId,
        name: row.subjectName,
        slug: row.subjectSlug,
        sortOrder: row.subjectSortOrder,
        categories: new Set(),
      };
      subjectMap.set(row.subjectId, entry);
    }
    entry.categories.add(row.category);
  }

  return {
    products: rows.map(mapCatalogRow),
    subjects: [...subjectMap.values()],
    fetchedAt: Date.now(),
  };
}

async function getSnapshot(): Promise<Snapshot> {
  if (snapshot && Date.now() - snapshot.fetchedAt < SNAPSHOT_TTL_MS) {
    return snapshot;
  }
  if (inFlight) {
    return inFlight;
  }

  const gen = generation;
  inFlight = loadSnapshot()
    .then((loaded) => {
      // Discard the result if the cache was invalidated mid-load.
      if (gen === generation) {
        snapshot = loaded;
      }
      return loaded;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Drop the cached catalog so the next read repopulates it from the database.
 * Call this whenever the published catalog changes (e.g. after a Notion sync).
 */
export function invalidateCatalogCache() {
  snapshot = null;
  inFlight = null;
  generation += 1;
}

// Per-user entitlements are NOT part of the snapshot. This query only returns
// product UUIDs (a few hundred bytes), so it stays cheap and always reflects a
// purchase immediately — no cache to invalidate on checkout.
async function getOwnedProductIds(userId?: string): Promise<Set<string>> {
  if (!userId) {
    return new Set();
  }

  const rows = await db
    .select({ productId: entitlements.productId })
    .from(entitlements)
    .where(
      and(eq(entitlements.userId, userId), isNull(entitlements.revokedAt))
    );

  return new Set(rows.map((row) => row.productId));
}

function withAccess(
  row: ReturnType<typeof mapCatalogRow>,
  ownedIds: Set<string>
) {
  return { ...row, hasAccess: ownedIds.has(row.id) };
}

export async function listPublishedProducts(
  filters: CatalogFilters = {},
  userId?: string
) {
  const [snap, ownedIds] = await Promise.all([
    getSnapshot(),
    getOwnedProductIds(userId),
  ]);

  let rows = snap.products;

  if (filters.category) {
    rows = rows.filter((row) => row.category === filters.category);
  }

  if (filters.subjectSlug) {
    rows = rows.filter((row) => row.subject.slug === filters.subjectSlug);
  }

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter(
      (row) =>
        row.title.toLowerCase().includes(search) ||
        (row.subject.name ?? "").toLowerCase().includes(search)
    );
  }

  let result = rows.map((row) => withAccess(row, ownedIds));

  if (filters.excludeOwned && userId) {
    result = result.filter((row) => !row.hasAccess);
  }

  return result;
}

export async function listPublishedSubjects(category?: ProductCategory) {
  const snap = await getSnapshot();

  return snap.subjects
    .filter((subject) => !category || subject.categories.has(category))
    .map((subject) => ({
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      sortOrder: subject.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getPublishedProductBySlug(slug: string, userId?: string) {
  const [snap, ownedIds] = await Promise.all([
    getSnapshot(),
    getOwnedProductIds(userId),
  ]);

  const row = snap.products.find((product) => product.slug === slug);
  return row ? withAccess(row, ownedIds) : null;
}

export async function listLibraryProducts(userId: string) {
  const [snap, ownedIds] = await Promise.all([
    getSnapshot(),
    getOwnedProductIds(userId),
  ]);

  return snap.products
    .filter((row) => ownedIds.has(row.id))
    .map((row) => withAccess(row, ownedIds));
}

export async function getReaderProduct(slug: string, userId: string) {
  const [snap, ownedIds] = await Promise.all([
    getSnapshot(),
    getOwnedProductIds(userId),
  ]);

  const cached = snap.products.find((product) => product.slug === slug);
  if (cached) {
    return withAccess(cached, ownedIds);
  }

  // The snapshot only holds published products. The reader historically also
  // served drafts/archived content by slug, so fall back to a direct read for
  // anything not in the cache.
  const row = await db
    .select(productSelection)
    .from(products)
    .innerJoin(subjects, eq(products.subjectId, subjects.id))
    .where(eq(products.slug, slug))
    .limit(1)
    .then((result) => result[0]);

  return row ? withAccess(mapCatalogRow(row), ownedIds) : null;
}

export async function getDashboardSummary(userId: string) {
  const [snap, ownedIds] = await Promise.all([
    getSnapshot(),
    getOwnedProductIds(userId),
  ]);

  return {
    libraryCount: ownedIds.size,
    publishedCount: snap.products.length,
  };
}

export const categoryValues = productCategory.enumValues;

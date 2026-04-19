import { db } from "@rafa-resumos/db";
import {
  entitlements,
  products,
  subjects,
  type ProductCategory,
  productCategory,
} from "@rafa-resumos/db/schema/app";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

export type CatalogFilters = {
  category?: ProductCategory;
  search?: string;
  subjectSlug?: string;
  excludeOwned?: boolean;
};

const catalogSelection = {
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
  entitlementId: entitlements.id,
} as const;

function buildPublishedWhere(filters: CatalogFilters) {
  const conditions = [eq(products.status, "published" as const)];

  if (filters.category) {
    conditions.push(eq(products.category, filters.category));
  }

  if (filters.subjectSlug) {
    conditions.push(eq(subjects.slug, filters.subjectSlug));
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(ilike(products.title, term), ilike(subjects.name, term))!
    );
  }

  return and(...conditions);
}

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
    hasAccess: Boolean(row.entitlementId),
    subject: {
      id: row.subjectId,
      name: row.subjectName,
      slug: row.subjectSlug,
    },
  };
}

function entitlementJoin(userId?: string) {
  return userId
    ? and(
        eq(entitlements.productId, products.id),
        eq(entitlements.userId, userId),
        isNull(entitlements.revokedAt)
      )
    : sql`false`;
}

export async function listPublishedProducts(
  filters: CatalogFilters = {},
  userId?: string
) {
  const conditions = [buildPublishedWhere(filters)];

  if (filters.excludeOwned && userId) {
    conditions.push(isNull(entitlements.id));
  }

  const rows = await db
    .select(catalogSelection)
    .from(products)
    .innerJoin(subjects, eq(products.subjectId, subjects.id))
    .leftJoin(entitlements, entitlementJoin(userId))
    .where(and(...conditions))
    .orderBy(
      desc(products.featured),
      asc(products.sortOrder),
      asc(products.title)
    );

  return rows.map(mapCatalogRow);
}

export async function listPublishedSubjects(category?: ProductCategory) {
  const conditions = [eq(products.status, "published" as const)];

  if (category) {
    conditions.push(eq(products.category, category));
  }

  return db
    .selectDistinct({
      id: subjects.id,
      name: subjects.name,
      slug: subjects.slug,
      sortOrder: subjects.sortOrder,
    })
    .from(subjects)
    .innerJoin(products, eq(products.subjectId, subjects.id))
    .where(and(...conditions))
    .orderBy(asc(subjects.sortOrder), asc(subjects.name));
}

export async function getPublishedProductBySlug(slug: string, userId?: string) {
  const row = await db
    .select(catalogSelection)
    .from(products)
    .innerJoin(subjects, eq(products.subjectId, subjects.id))
    .leftJoin(entitlements, entitlementJoin(userId))
    .where(
      and(eq(products.slug, slug), eq(products.status, "published" as const))
    )
    .limit(1)
    .then((result) => result[0]);

  return row ? mapCatalogRow(row) : null;
}

export async function listLibraryProducts(userId: string) {
  const rows = await db
    .select(catalogSelection)
    .from(products)
    .innerJoin(subjects, eq(products.subjectId, subjects.id))
    .innerJoin(
      entitlements,
      and(
        eq(entitlements.productId, products.id),
        eq(entitlements.userId, userId),
        isNull(entitlements.revokedAt)
      )
    )
    .orderBy(
      desc(products.featured),
      asc(products.sortOrder),
      asc(products.title)
    );

  return rows.map(mapCatalogRow);
}

export async function getReaderProduct(slug: string, userId: string) {
  const row = await db
    .select(catalogSelection)
    .from(products)
    .innerJoin(subjects, eq(products.subjectId, subjects.id))
    .leftJoin(entitlements, entitlementJoin(userId))
    .where(eq(products.slug, slug))
    .limit(1)
    .then((result) => result[0]);

  return row ? mapCatalogRow(row) : null;
}

export async function getDashboardSummary(userId: string) {
  const [libraryCountRow, publishedCountRow] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(entitlements)
      .where(
        and(eq(entitlements.userId, userId), isNull(entitlements.revokedAt))
      )
      .then((result) => result[0]),
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(products)
      .where(eq(products.status, "published" as const))
      .then((result) => result[0]),
  ]);

  return {
    libraryCount: libraryCountRow?.count ?? 0,
    publishedCount: publishedCountRow?.count ?? 0,
  };
}

export const categoryValues = productCategory.enumValues;

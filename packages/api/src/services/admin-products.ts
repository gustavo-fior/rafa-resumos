import { db } from "@rafa-resumos/db";
import {
  entitlements,
  orders,
  productExclusions,
  products,
  subjects,
  type ProductCategory,
  type ProductStatus,
} from "@rafa-resumos/db/schema/app";
import { asc, desc, eq, sql } from "drizzle-orm";

import { invalidateCatalogCache } from "./catalog";

export type AdminProductListItem = {
  id: string;
  notionPageId: string;
  title: string;
  slug: string;
  category: ProductCategory;
  status: ProductStatus;
  subjectName: string;
  iconEmoji: string | null;
  iconUrl: string | null;
  priceCents: number;
  activeEntitlementCount: number;
  paidOrderCount: number;
  lastSyncedAt: Date | null;
};

export type AdminExcludedProduct = {
  notionPageId: string;
  title: string;
  slug: string;
  excludedAt: Date;
};

export async function listAdminProducts(): Promise<AdminProductListItem[]> {
  const rows = await db
    .select({
      id: products.id,
      notionPageId: products.notionPageId,
      title: products.title,
      slug: products.slug,
      category: products.category,
      status: products.status,
      subjectName: subjects.name,
      iconEmoji: products.iconEmoji,
      iconUrl: products.iconUrl,
      priceCents: products.priceCents,
      lastSyncedAt: products.lastSyncedAt,
      activeEntitlementCount: sql<number>`(
        select count(*)::int from ${entitlements}
        where ${entitlements.productId} = ${products.id}
          and ${entitlements.revokedAt} is null
      )`,
      paidOrderCount: sql<number>`(
        select count(*)::int from ${orders}
        where ${orders.productId} = ${products.id}
          and ${orders.status} = 'paid'
      )`,
    })
    .from(products)
    .innerJoin(subjects, eq(products.subjectId, subjects.id))
    .orderBy(asc(subjects.sortOrder), asc(subjects.name), asc(products.title));

  return rows.map((row) => ({
    ...row,
    // Same guard as the users list: inline data: URIs can be multi-MB.
    iconUrl:
      row.iconUrl && !row.iconUrl.startsWith("data:") ? row.iconUrl : null,
  }));
}

export async function listExcludedProducts(): Promise<AdminExcludedProduct[]> {
  return db
    .select({
      notionPageId: productExclusions.notionPageId,
      title: productExclusions.title,
      slug: productExclusions.slug,
      excludedAt: productExclusions.excludedAt,
    })
    .from(productExclusions)
    .orderBy(desc(productExclusions.excludedAt));
}

/**
 * Permanently removes a resumo. Orders and entitlements cascade with it, and a
 * tombstone keyed by the Notion page id stops the next sync from re-importing
 * the page. Returns null when the product no longer exists.
 */
export async function deleteAdminProduct(productId: string) {
  const deleted = await db.transaction(async (tx) => {
    const product = await tx
      .select({
        id: products.id,
        notionPageId: products.notionPageId,
        title: products.title,
        slug: products.slug,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
      .then((result) => result[0]);

    if (!product) return null;

    await tx
      .insert(productExclusions)
      .values({
        notionPageId: product.notionPageId,
        slug: product.slug,
        title: product.title,
      })
      .onConflictDoUpdate({
        target: productExclusions.notionPageId,
        set: {
          excludedAt: new Date(),
          slug: product.slug,
          title: product.title,
        },
      });

    await tx.delete(products).where(eq(products.id, product.id));

    return product;
  });

  if (deleted) invalidateCatalogCache();
  return deleted;
}

/**
 * Drops the tombstone so the next Notion sync imports the page again.
 */
export async function restoreExcludedProduct(notionPageId: string) {
  const removed = await db
    .delete(productExclusions)
    .where(eq(productExclusions.notionPageId, notionPageId))
    .returning({ notionPageId: productExclusions.notionPageId });

  return removed.length > 0;
}

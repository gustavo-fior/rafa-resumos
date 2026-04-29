import { db } from "@rafa-resumos/db";
import { entitlements, orders, products } from "@rafa-resumos/db/schema/app";
import { user } from "@rafa-resumos/db/schema/auth";
import { and, countDistinct, desc, eq, isNull, sql } from "drizzle-orm";

export type AdminStats = {
  averageOrderCents: number;
  lastOrderAt: Date | null;
  lastSyncAt: Date | null;
  paidOrderCount: number;
  payingUserCount: number;
  pendingOrderCount: number;
  publishedProductCount: number;
  revenuePerPayingUserCents: number;
  revenuePerUserCents: number;
  totalEntitlementCount: number;
  totalProductCount: number;
  totalRevenueCents: number;
  totalUserCount: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [
    [userRow],
    [revenueRow],
    [pendingRow],
    [productRow],
    [entitlementRow],
    [lastSyncRow],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(user),
    db
      .select({
        lastOrderAt: sql<Date | null>`max(${orders.paidAt})`,
        paidOrders: sql<number>`count(*)::int`,
        payingUsers: countDistinct(orders.userId),
        totalRevenueCents: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
      })
      .from(orders)
      .where(eq(orders.status, "paid")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, "pending")),
    db
      .select({
        publishedCount: sql<number>`count(*) filter (where ${products.status} = 'published')::int`,
        totalCount: sql<number>`count(*)::int`,
      })
      .from(products),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(entitlements)
      .where(sql`${entitlements.revokedAt} is null`),
    db
      .select({ lastSyncAt: sql<Date | null>`max(${products.lastSyncedAt})` })
      .from(products),
  ]);

  const totalUserCount = userRow?.count ?? 0;
  const totalRevenueCents = revenueRow?.totalRevenueCents ?? 0;
  const paidOrderCount = revenueRow?.paidOrders ?? 0;
  const payingUserCount = revenueRow?.payingUsers ?? 0;
  const pendingOrderCount = pendingRow?.count ?? 0;
  const publishedProductCount = productRow?.publishedCount ?? 0;
  const totalProductCount = productRow?.totalCount ?? 0;
  const totalEntitlementCount = entitlementRow?.count ?? 0;

  return {
    averageOrderCents: paidOrderCount
      ? Math.round(totalRevenueCents / paidOrderCount)
      : 0,
    lastOrderAt: revenueRow?.lastOrderAt ?? null,
    lastSyncAt: lastSyncRow?.lastSyncAt ?? null,
    paidOrderCount,
    payingUserCount,
    pendingOrderCount,
    publishedProductCount,
    revenuePerPayingUserCents: payingUserCount
      ? Math.round(totalRevenueCents / payingUserCount)
      : 0,
    revenuePerUserCents: totalUserCount
      ? Math.round(totalRevenueCents / totalUserCount)
      : 0,
    totalEntitlementCount,
    totalProductCount,
    totalRevenueCents,
    totalUserCount,
  };
}

export type AdminUserProduct = {
  id: string;
  title: string;
  slug: string;
  iconEmoji: string | null;
  iconUrl: string | null;
  priceCents: number;
  grantedAt: Date;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
  products: AdminUserProduct[];
};

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  const rows = await db
    .select({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
      userCreatedAt: user.createdAt,
      productId: products.id,
      productTitle: products.title,
      productSlug: products.slug,
      productIconEmoji: products.iconEmoji,
      productIconUrl: products.iconUrl,
      productPriceCents: products.priceCents,
      grantedAt: entitlements.grantedAt,
    })
    .from(user)
    .leftJoin(
      entitlements,
      and(eq(entitlements.userId, user.id), isNull(entitlements.revokedAt))
    )
    .leftJoin(products, eq(products.id, entitlements.productId))
    .orderBy(desc(user.createdAt), desc(entitlements.grantedAt));

  const byUserId = new Map<string, AdminUserListItem>();
  for (const row of rows) {
    let entry = byUserId.get(row.userId);
    if (!entry) {
      entry = {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
        image: row.userImage,
        createdAt: row.userCreatedAt,
        products: [],
      };
      byUserId.set(row.userId, entry);
    }
    if (row.productId && row.productTitle && row.productSlug && row.grantedAt) {
      entry.products.push({
        id: row.productId,
        title: row.productTitle,
        slug: row.productSlug,
        iconEmoji: row.productIconEmoji,
        iconUrl: row.productIconUrl,
        priceCents: row.productPriceCents ?? 0,
        grantedAt: row.grantedAt,
      });
    }
  }
  return Array.from(byUserId.values());
}

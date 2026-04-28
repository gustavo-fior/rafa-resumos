import { db } from "@rafa-resumos/db";
import { entitlements, orders, products } from "@rafa-resumos/db/schema/app";
import { user } from "@rafa-resumos/db/schema/auth";
import { countDistinct, eq, sql } from "drizzle-orm";
export async function getAdminStats() {
    const [[userRow], [revenueRow], [pendingRow], [productRow], [entitlementRow], [lastSyncRow],] = await Promise.all([
        db.select({ count: sql `count(*)::int` }).from(user),
        db
            .select({
            lastOrderAt: sql `max(${orders.paidAt})`,
            paidOrders: sql `count(*)::int`,
            payingUsers: countDistinct(orders.userId),
            totalRevenueCents: sql `coalesce(sum(${orders.totalCents}), 0)::int`,
        })
            .from(orders)
            .where(eq(orders.status, "paid")),
        db
            .select({ count: sql `count(*)::int` })
            .from(orders)
            .where(eq(orders.status, "pending")),
        db
            .select({
            publishedCount: sql `count(*) filter (where ${products.status} = 'published')::int`,
            totalCount: sql `count(*)::int`,
        })
            .from(products),
        db
            .select({ count: sql `count(*)::int` })
            .from(entitlements)
            .where(sql `${entitlements.revokedAt} is null`),
        db
            .select({ lastSyncAt: sql `max(${products.lastSyncedAt})` })
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

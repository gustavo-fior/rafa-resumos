import { createDb } from "@rafa-resumos/db";
import { entitlements, products } from "@rafa-resumos/db/schema/app";
import { user } from "@rafa-resumos/db/schema/auth";
import { and, eq, inArray, isNull } from "drizzle-orm";

export const OWNER_EMAILS = [
  "rafacastan.resumos@gmail.com",
  "gustavo_fior@outlook.com",
] as const;

const OWNER_EMAIL_SET = new Set<string>(
  OWNER_EMAILS.map((email) => email.toLowerCase())
);

export function isOwnerEmail(email: string | null | undefined) {
  if (!email) return false;
  return OWNER_EMAIL_SET.has(email.toLowerCase());
}

export async function ensureOwnerEntitlementsForUser(userId: string) {
  const db = createDb();

  const publishedProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.status, "published"));

  if (publishedProducts.length === 0) return;

  const existing = await db
    .select({ productId: entitlements.productId })
    .from(entitlements)
    .where(
      and(eq(entitlements.userId, userId), isNull(entitlements.revokedAt))
    );

  const existingSet = new Set(existing.map((row) => row.productId));
  const toInsert = publishedProducts
    .filter((p) => !existingSet.has(p.id))
    .map((p) => ({
      userId,
      productId: p.id,
      grantedBy: "owner-access",
    }));

  if (toInsert.length === 0) return;

  await db.insert(entitlements).values(toInsert).onConflictDoNothing();
}

export async function ensureOwnerEntitlements() {
  const db = createDb();

  const owners = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(
      inArray(
        user.email,
        OWNER_EMAILS.map((email) => email)
      )
    );

  if (owners.length === 0) return;

  const publishedProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.status, "published"));

  if (publishedProducts.length === 0) return;

  const existing = await db
    .select({ userId: entitlements.userId, productId: entitlements.productId })
    .from(entitlements)
    .where(
      and(
        inArray(
          entitlements.userId,
          owners.map((o) => o.id)
        ),
        isNull(entitlements.revokedAt)
      )
    );

  const existingSet = new Set(
    existing.map((row) => `${row.userId}:${row.productId}`)
  );

  const toInsert: Array<{
    userId: string;
    productId: string;
    grantedBy: string;
  }> = [];
  for (const owner of owners) {
    for (const product of publishedProducts) {
      if (!existingSet.has(`${owner.id}:${product.id}`)) {
        toInsert.push({
          userId: owner.id,
          productId: product.id,
          grantedBy: "owner-access",
        });
      }
    }
  }

  if (toInsert.length === 0) return;

  await db.insert(entitlements).values(toInsert).onConflictDoNothing();
}

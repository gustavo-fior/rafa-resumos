import { db } from "@rafa-resumos/db";
import {
  entitlements,
  orders,
  products,
  type OrderStatus,
  webhookEvents,
} from "@rafa-resumos/db/schema/app";
import { env } from "@rafa-resumos/env/abacatepay";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

import {
  type AbacatepayTransparentWebhookPayload,
  checkTransparentPixCharge,
  createTransparentPixCharge,
  simulateTransparentPixCharge,
} from "./abacatepay";
import { getPublishedProductBySlug } from "./catalog";

type PurchaseRow = {
  brCode: string | null;
  brCodeBase64: string | null;
  entitlementId: string | null;
  id: string;
  paidAt: Date | null;
  paymentExpiresAt: Date | null;
  paymentMethod: string;
  productId: string;
  productSlug: string;
  providerChargeId: string | null;
  providerStatus: string | null;
  rawProviderPayload: string | null;
  receiptUrl: string | null;
  status: OrderStatus;
  totalCents: number;
  userId: string;
};

type ProviderState = {
  expiresAt?: string | null;
  rawPayload: unknown;
  receiptUrl?: string | null;
  status: string;
  updatedAt?: string | null;
};

export type PurchaseSession = {
  alreadyOwned: boolean;
  amountCents: number;
  brCode: string | null;
  brCodeBase64: string | null;
  canSimulate: boolean;
  expiresAt: Date | null;
  hasAccess: boolean;
  orderId: string | null;
  paidAt: Date | null;
  productId: string;
  productSlug: string;
  providerStatus: string | null;
  receiptUrl: string | null;
  status: OrderStatus;
};

const orderSelection = {
  brCode: orders.brCode,
  brCodeBase64: orders.brCodeBase64,
  entitlementId: entitlements.id,
  id: orders.id,
  paidAt: orders.paidAt,
  paymentExpiresAt: orders.paymentExpiresAt,
  paymentMethod: orders.paymentMethod,
  productId: orders.productId,
  productSlug: products.slug,
  providerChargeId: orders.providerChargeId,
  providerStatus: orders.providerStatus,
  rawProviderPayload: orders.rawProviderPayload,
  receiptUrl: orders.receiptUrl,
  status: orders.status,
  totalCents: orders.totalCents,
  userId: orders.userId,
} as const;

function toInternalOrderStatus(providerStatus: string): OrderStatus {
  switch (providerStatus.toUpperCase()) {
    case "PAID":
      return "paid";
    case "REFUNDED":
      return "refunded";
    case "DISPUTED":
      return "disputed";
    case "EXPIRED":
    case "CANCELLED":
    case "CANCELED":
      return "expired";
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

function isDevModeApiKey() {
  return env.ABACATEPAY_API_KEY.startsWith("abc_dev_");
}

function serializePayload(payload: unknown) {
  return JSON.stringify(payload);
}

function truncateDescription(title: string) {
  return `Rafaela Resumos - ${title}`.slice(0, 120);
}

function mapPurchaseRow(row: PurchaseRow): PurchaseSession {
  return {
    alreadyOwned: false,
    amountCents: row.totalCents,
    brCode: row.brCode,
    brCodeBase64: row.brCodeBase64,
    canSimulate:
      isDevModeApiKey() &&
      row.status === "pending" &&
      Boolean(row.providerChargeId),
    expiresAt: row.paymentExpiresAt,
    hasAccess: Boolean(row.entitlementId),
    orderId: row.id,
    paidAt: row.paidAt,
    productId: row.productId,
    productSlug: row.productSlug,
    providerStatus: row.providerStatus,
    receiptUrl: row.receiptUrl,
    status: row.status,
  };
}

async function getOrderByIdForUser(orderId: string, userId: string) {
  return db
    .select(orderSelection)
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .leftJoin(
      entitlements,
      and(
        eq(entitlements.productId, orders.productId),
        eq(entitlements.userId, userId),
        isNull(entitlements.revokedAt)
      )
    )
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)
    .then((result) => result[0] as PurchaseRow | undefined);
}

async function getOrderByProviderChargeId(providerChargeId: string) {
  return db
    .select(orderSelection)
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .leftJoin(
      entitlements,
      and(
        eq(entitlements.productId, orders.productId),
        eq(entitlements.userId, orders.userId),
        isNull(entitlements.revokedAt)
      )
    )
    .where(eq(orders.providerChargeId, providerChargeId))
    .limit(1)
    .then((result) => result[0] as PurchaseRow | undefined);
}

async function grantEntitlementForOrder(order: PurchaseRow, grantedBy: string) {
  await db
    .insert(entitlements)
    .values({
      grantedBy,
      productId: order.productId,
      userId: order.userId,
    })
    .onConflictDoNothing({
      target: [entitlements.userId, entitlements.productId],
    });
}

async function revokeEntitlementForOrder(order: PurchaseRow) {
  await db
    .update(entitlements)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(entitlements.userId, order.userId),
        eq(entitlements.productId, order.productId),
        isNull(entitlements.revokedAt)
      )
    );
}

async function applyProviderStateToOrder(
  order: PurchaseRow,
  providerState: ProviderState,
  source: string
) {
  const nextStatus = toInternalOrderStatus(providerState.status);

  await db
    .update(orders)
    .set({
      paidAt:
        nextStatus === "paid"
          ? providerState.updatedAt
            ? new Date(providerState.updatedAt)
            : order.paidAt ?? new Date()
          : order.paidAt,
      paymentExpiresAt: providerState.expiresAt
        ? new Date(providerState.expiresAt)
        : order.paymentExpiresAt,
      providerStatus: providerState.status,
      rawProviderPayload: serializePayload(providerState.rawPayload),
      receiptUrl: providerState.receiptUrl ?? order.receiptUrl,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  if (nextStatus === "paid") {
    await grantEntitlementForOrder(order, source);
  }

  if (nextStatus === "refunded" || nextStatus === "disputed") {
    await revokeEntitlementForOrder(order);
  }
}

async function refreshPendingOrder(order: PurchaseRow) {
  if (order.status !== "pending" || !order.providerChargeId) {
    return order;
  }

  const providerState = await checkTransparentPixCharge(order.providerChargeId);
  const nextStatus = toInternalOrderStatus(providerState.status);

  if (
    nextStatus !== order.status ||
    providerState.status !== order.providerStatus ||
    providerState.expiresAt !== order.paymentExpiresAt?.toISOString()
  ) {
    await applyProviderStateToOrder(
      order,
      {
        expiresAt: providerState.expiresAt,
        rawPayload: providerState,
        status: providerState.status,
      },
      "abacatepay:status-check"
    );
  }

  return (await getOrderByIdForUser(order.id, order.userId)) ?? order;
}

async function findReusablePendingOrder(userId: string, productId: string) {
  const existing = await db
    .select(orderSelection)
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .leftJoin(
      entitlements,
      and(
        eq(entitlements.productId, orders.productId),
        eq(entitlements.userId, orders.userId),
        isNull(entitlements.revokedAt)
      )
    )
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.productId, productId),
        eq(orders.status, "pending"),
        gt(orders.paymentExpiresAt, new Date())
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(1)
    .then((result) => result[0] as PurchaseRow | undefined);

  if (!existing) {
    return null;
  }

  return refreshPendingOrder(existing);
}

async function createOrderRecord(input: {
  productId: string;
  totalCents: number;
  userId: string;
}) {
  const createdOrder = await db
    .insert(orders)
    .values({
      productId: input.productId,
      totalCents: input.totalCents,
      userId: input.userId,
    })
    .returning({
      id: orders.id,
    });

  const order = createdOrder[0];

  if (!order) {
    throw new Error("Could not create the order record.");
  }

  return order;
}

export async function claimFreeProduct(input: {
  slug: string;
  userId: string;
}) {
  const product = await getPublishedProductBySlug(input.slug, input.userId);

  if (!product) {
    throw new Error("Produto não encontrado.");
  }

  if (product.priceCents !== 0) {
    throw new Error("Este resumo não é gratuito.");
  }

  if (product.hasAccess) {
    return { alreadyOwned: true as const, productId: product.id };
  }

  await db
    .insert(entitlements)
    .values({
      grantedBy: "free_claim",
      productId: product.id,
      userId: input.userId,
    })
    .onConflictDoNothing({
      target: [entitlements.userId, entitlements.productId],
    });

  return { alreadyOwned: false as const, productId: product.id };
}

export async function getActivePurchaseForProductSlug(
  userId: string,
  slug: string
): Promise<PurchaseSession | null> {
  const existing = await db
    .select(orderSelection)
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .leftJoin(
      entitlements,
      and(
        eq(entitlements.productId, orders.productId),
        eq(entitlements.userId, orders.userId),
        isNull(entitlements.revokedAt)
      )
    )
    .where(
      and(
        eq(orders.userId, userId),
        eq(products.slug, slug),
        eq(orders.status, "pending")
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(1)
    .then((result) => result[0] as PurchaseRow | undefined);

  if (
    !existing ||
    (existing.paymentExpiresAt && existing.paymentExpiresAt <= new Date())
  ) {
    return null;
  }

  return mapPurchaseRow(await refreshPendingOrder(existing));
}

export async function createPixPurchase(input: {
  slug: string;
  userId: string;
}): Promise<PurchaseSession> {
  const product = await getPublishedProductBySlug(input.slug, input.userId);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (product.hasAccess) {
    return {
      alreadyOwned: true,
      amountCents: product.priceCents,
      brCode: null,
      brCodeBase64: null,
      canSimulate: false,
      expiresAt: null,
      hasAccess: true,
      orderId: null,
      paidAt: new Date(),
      productId: product.id,
      productSlug: product.slug,
      providerStatus: "PAID",
      receiptUrl: null,
      status: "paid",
    };
  }

  if (product.priceCents <= 0) {
    throw new Error(
      "This product does not have a valid PIX amount configured yet."
    );
  }

  const reusableOrder = await findReusablePendingOrder(
    input.userId,
    product.id
  );

  if (reusableOrder) {
    return mapPurchaseRow(reusableOrder);
  }

  const createdOrder = await createOrderRecord({
    productId: product.id,
    totalCents: product.priceCents,
    userId: input.userId,
  });

  try {
    const charge = await createTransparentPixCharge({
      amount: product.priceCents,
      description: truncateDescription(product.title),
      expiresIn: 60 * 60,
      metadata: {
        orderId: createdOrder.id,
        productId: product.id,
        productSlug: product.slug,
        userId: input.userId,
      },
    });

    await db
      .update(orders)
      .set({
        brCode: charge.brCode,
        brCodeBase64: charge.brCodeBase64,
        paymentExpiresAt: new Date(charge.expiresAt),
        providerChargeId: charge.id,
        providerStatus: charge.status,
        rawProviderPayload: serializePayload(charge),
        receiptUrl: charge.receiptUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, createdOrder.id));
  } catch (error) {
    await db
      .update(orders)
      .set({
        providerStatus: "FAILED",
        rawProviderPayload: serializePayload({
          error: error instanceof Error ? error.message : "unknown error",
        }),
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, createdOrder.id));

    throw error;
  }

  const order = await getOrderByIdForUser(createdOrder.id, input.userId);

  if (!order) {
    throw new Error("Could not load the PIX order after creation.");
  }

  return mapPurchaseRow(order);
}

export async function getPurchaseStatus(input: {
  orderId: string;
  userId: string;
}): Promise<PurchaseSession> {
  const order = await getOrderByIdForUser(input.orderId, input.userId);

  if (!order) {
    throw new Error("Order not found.");
  }

  return mapPurchaseRow(await refreshPendingOrder(order));
}

export async function simulatePixPurchase(input: {
  orderId: string;
  userId: string;
}): Promise<PurchaseSession> {
  const order = await getOrderByIdForUser(input.orderId, input.userId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!isDevModeApiKey()) {
    throw new Error(
      "PIX simulation is only available with a development API key."
    );
  }

  if (!order.providerChargeId) {
    throw new Error("This order does not have an AbacatePay charge yet.");
  }

  await simulateTransparentPixCharge(order.providerChargeId, {
    orderId: order.id,
  });

  return getPurchaseStatus(input);
}

export async function processAbacatepayWebhook(
  payload: AbacatepayTransparentWebhookPayload,
  rawPayload: string
) {
  const existingEvent = await db
    .select({
      id: webhookEvents.id,
      processedAt: webhookEvents.processedAt,
    })
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.provider, "abacatepay"),
        eq(webhookEvents.providerEventId, payload.id)
      )
    )
    .limit(1)
    .then((result) => result[0]);

  const eventRecordId =
    existingEvent?.id ??
    (
      await db
        .insert(webhookEvents)
        .values({
          eventType: payload.event,
          provider: "abacatepay",
          providerEventId: payload.id,
          rawPayload,
        })
        .returning({
          id: webhookEvents.id,
        })
    )[0]?.id;

  if (!eventRecordId) {
    throw new Error("Could not create a webhook event record.");
  }

  if (existingEvent?.processedAt) {
    return {
      duplicate: true,
      processed: true,
    };
  }

  const transparent = payload.data.transparent;
  const order = await getOrderByProviderChargeId(transparent.id);

  if (order) {
    await applyProviderStateToOrder(
      order,
      {
        rawPayload: payload,
        receiptUrl: transparent.receiptUrl ?? null,
        status: transparent.status,
        updatedAt: transparent.updatedAt,
      },
      `abacatepay:webhook:${payload.event}`
    );
  }

  await db
    .update(webhookEvents)
    .set({
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(webhookEvents.id, eventRecordId));

  return {
    duplicate: false,
    processed: true,
  };
}

import { relations } from "drizzle-orm";
import { boolean, doublePrecision, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const productCategory = pgEnum("product_category", [
  "medicina",
  "utilidades",
]);

export const productStatus = pgEnum("product_status", ["draft", "published", "archived"]);
export const paymentProvider = pgEnum("payment_provider", ["abacatepay"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "refunded",
  "disputed",
  "expired",
  "failed",
]);

export const subjects = pgTable(
  "subject",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: doublePrecision("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("subject_slug_unique").on(table.slug)],
);

export const products = pgTable(
  "product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    notionPageId: text("notion_page_id").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    seoDescription: text("seo_description"),
    category: productCategory("category").notNull(),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    iconEmoji: text("icon_emoji"),
    iconUrl: text("icon_url"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: doublePrecision("sort_order").notNull().default(0),
    status: productStatus("status").notNull().default("draft"),
    priceCents: integer("price_cents").notNull().default(0),
    contentMarkdown: text("content_markdown"),
    notionLastEditedAt: timestamp("notion_last_edited_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("product_slug_unique").on(table.slug),
    uniqueIndex("product_notion_page_id_unique").on(table.notionPageId),
    index("product_status_idx").on(table.status),
    index("product_subject_id_idx").on(table.subjectId),
    index("product_category_idx").on(table.category),
  ],
);

export const entitlements = pgTable(
  "entitlement",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    grantedBy: text("granted_by"),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("entitlement_user_product_unique").on(table.userId, table.productId),
    index("entitlement_user_id_idx").on(table.userId),
    index("entitlement_product_id_idx").on(table.productId),
  ],
);

export const orders = pgTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    provider: paymentProvider("provider").notNull().default("abacatepay"),
    status: orderStatus("status").notNull().default("pending"),
    totalCents: integer("total_cents").notNull(),
    providerChargeId: text("provider_charge_id"),
    providerStatus: text("provider_status"),
    paymentMethod: text("payment_method").notNull().default("PIX"),
    receiptUrl: text("receipt_url"),
    brCode: text("br_code"),
    brCodeBase64: text("br_code_base64"),
    paymentExpiresAt: timestamp("payment_expires_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    rawProviderPayload: text("raw_provider_payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("order_provider_charge_id_unique").on(table.providerChargeId),
    index("order_user_id_idx").on(table.userId),
    index("order_product_id_idx").on(table.productId),
    index("order_status_idx").on(table.status),
  ],
);

export const webhookEvents = pgTable(
  "webhook_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    provider: paymentProvider("provider").notNull().default("abacatepay"),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    rawPayload: text("raw_payload").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("webhook_event_provider_event_unique").on(table.provider, table.providerEventId),
    index("webhook_event_type_idx").on(table.eventType),
  ],
);

export const subjectRelations = relations(subjects, ({ many }) => ({
  products: many(products),
}));

export const productRelations = relations(products, ({ many, one }) => ({
  orders: many(orders),
  subject: one(subjects, {
    fields: [products.subjectId],
    references: [subjects.id],
  }),
  entitlements: many(entitlements),
}));

export const entitlementRelations = relations(entitlements, ({ one }) => ({
  product: one(products, {
    fields: [entitlements.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [entitlements.userId],
    references: [user.id],
  }),
}));

export const orderRelations = relations(orders, ({ one }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
}));

export type ProductCategory = (typeof productCategory.enumValues)[number];
export type ProductStatus = (typeof productStatus.enumValues)[number];
export type PaymentProvider = (typeof paymentProvider.enumValues)[number];
export type OrderStatus = (typeof orderStatus.enumValues)[number];

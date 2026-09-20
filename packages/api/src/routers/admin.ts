import { db } from "@rafa-resumos/db";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../index";
import {
  deleteAdminProduct,
  listAdminProducts,
  listExcludedProducts,
  restoreExcludedProduct,
} from "../services/admin-products";
import { getAdminStats, listAdminUsers } from "../services/admin-stats";
import { syncNotionProducts } from "../services/notion-sync";

export const adminRouter = router({
  getStats: adminProcedure.query(async () => {
    return getAdminStats();
  }),
  listUsers: adminProcedure.query(async () => {
    return listAdminUsers();
  }),
  listProducts: adminProcedure.query(async () => {
    return listAdminProducts();
  }),
  listExcludedProducts: adminProcedure.query(async () => {
    return listExcludedProducts();
  }),
  deleteProduct: adminProcedure
    .input(z.object({ productId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const deleted = await deleteAdminProduct(input.productId);
      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resumo não encontrado. Ele pode já ter sido excluído.",
        });
      }
      return { ok: true as const, title: deleted.title };
    }),
  restoreProduct: adminProcedure
    .input(z.object({ notionPageId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const restored = await restoreExcludedProduct(input.notionPageId);
      if (!restored) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Este resumo não está na lista de excluídos.",
        });
      }
      return { ok: true as const };
    }),
  resetFinance: adminProcedure.mutation(async () => {
    try {
      await db.execute(
        sql`TRUNCATE TABLE "webhook_event", "entitlement", "order" RESTART IDENTITY CASCADE`,
      );
      return { ok: true as const };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Falha ao apagar pedidos e liberações.",
      });
    }
  }),
  syncNotion: adminProcedure.mutation(async () => {
    const startedAt = Date.now();
    try {
      await syncNotionProducts();
      return { durationMs: Date.now() - startedAt, ok: true as const };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Falha ao sincronizar com o Notion.",
      });
    }
  }),
});

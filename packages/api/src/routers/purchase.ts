import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
  claimFreeProduct,
  createPixPurchase,
  getPurchaseStatus,
  simulatePixPurchase,
} from "../services/purchase";

export const purchaseRouter = router({
  claimFree: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await claimFreeProduct({
          slug: input.slug,
          userId: ctx.session.user.id,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Não foi possível liberar este resumo.",
        });
      }
    }),
  createPix: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await createPixPurchase({
          slug: input.slug,
          userId: ctx.session.user.id,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Could not create the PIX payment.",
        });
      }
    }),
  getStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        return await getPurchaseStatus({
          orderId: input.orderId,
          userId: ctx.session.user.id,
        });
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: error instanceof Error ? error.message : "Order not found.",
        });
      }
    }),
  simulatePix: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await simulatePixPurchase({
          orderId: input.orderId,
          userId: ctx.session.user.id,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Could not simulate the PIX payment.",
        });
      }
    }),
});

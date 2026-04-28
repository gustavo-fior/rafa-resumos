import { TRPCError } from "@trpc/server";
import { productCategory } from "@rafa-resumos/db/schema/app";
import { z } from "zod";
import { publicProcedure, router } from "../index";
import { getPublishedProductBySlug, listPublishedProducts, } from "../services/catalog";
export const catalogRouter = router({
    getBySlug: publicProcedure
        .input(z.object({
        slug: z.string().min(1),
    }))
        .query(async ({ ctx, input }) => {
        const product = await getPublishedProductBySlug(input.slug, ctx.session?.user.id);
        if (!product) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Product not found.",
            });
        }
        return product;
    }),
    listPublished: publicProcedure
        .input(z
        .object({
        category: z.enum(productCategory.enumValues).optional(),
        search: z.string().trim().optional(),
        subjectSlug: z.string().trim().optional(),
    })
        .optional())
        .query(({ ctx, input }) => listPublishedProducts(input, ctx.session?.user.id)),
});

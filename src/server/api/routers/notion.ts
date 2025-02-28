import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getNotionPages } from "~/utils/notion";
export const notionRouter = createTRPCRouter({
  getPages: publicProcedure.query(async () => {
    return await getNotionPages();
  }),
});

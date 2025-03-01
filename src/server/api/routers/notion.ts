import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  getContentPages,
  getOrganizationPages,
  getUtilitiesPages,
} from "~/utils/notion";

export const notionRouter = createTRPCRouter({
  getContentPages: publicProcedure.query(async () => {
    return await getContentPages();
  }),
  getOrganizationPages: publicProcedure.query(async () => {
    return await getOrganizationPages();
  }),
  getUtilitiesPages: publicProcedure.query(async () => {
    return await getUtilitiesPages();
  }),
});

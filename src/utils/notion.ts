import { Client, isNotionClientError, LogLevel } from "@notionhq/client";
import { type BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { env } from "~/env";

const notion = new Client({
  auth: env.NOTION_API_KEY,
  logLevel: LogLevel.INFO,
});

export interface PageDetails {
  id: string;
  title: string;
  icon: string | null;
  iconUrl: string | null;
  publicUrl: string | null;
}

// Type for Notion page response with the properties we need
interface NotionPageResponse {
  id: string;
  icon?: {
    type: string;
    emoji?: string;
    file?: {
      url: string;
    };
  } | null;
  public_url?: string | null;
}

export async function getContentPages(): Promise<PageDetails[]> {
  const pages = await getNotionPages("143fbe83ff3b80b29b8fd9d48281cfe6");

  return pages;
}

export async function getOrganizationPages(): Promise<PageDetails[]> {
  const pages = await getNotionPages("1a9fbe83ff3b80b69737e9a23bc91ec6");

  const databasePages = await getNotionDatabases(
    "1a9fbe83ff3b80b69737e9a23bc91ec6",
  );

  const allPages = [...pages, ...databasePages];
  return allPages;
}

export async function getUtilitiesPages(): Promise<PageDetails[]> {
  const pages = await getNotionPages("1a9fbe83ff3b80fbad6cd6ba67cc1cf5");
  return pages;
}

export async function getNotionPages(id: string): Promise<PageDetails[]> {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: id,
      page_size: 100,
    });

    const childPages = blocks.results.filter(
      (block) => (block as BlockObjectResponse).type === "child_page",
    ) as BlockObjectResponse[];

    const childPagesWithDetails = await Promise.all(
      childPages.map(async (page) => {
        const pageId = page.id;

        // Retrieve full page details to get icon and publicUrl
        const pageDetails = (await notion.pages.retrieve({
          page_id: pageId,
        })) as unknown as NotionPageResponse;

        // Get the title from the child_page block
        const title =
          page.type === "child_page" && page.child_page
            ? (page.child_page.title ?? "Untitled")
            : "Untitled";

        // Get the icon (emoji) from the page details
        let icon: string | null = null;
        if (
          pageDetails.icon &&
          pageDetails.icon.type === "emoji" &&
          pageDetails.icon.emoji
        ) {
          icon = pageDetails.icon.emoji;
        }

        let iconUrl: string | null = null;

        if (pageDetails.icon && pageDetails.icon.type === "file") {
          iconUrl = pageDetails.icon.file?.url ?? null;
        }

        // Get the publicUrl from the page details
        const publicUrl = pageDetails.public_url ?? null;

        return {
          id: pageId,
          title,
          icon,
          publicUrl,
          iconUrl,
        };
      }),
    );

    return childPagesWithDetails;
  } catch (error) {
    if (isNotionClientError(error)) {
      console.error("Error fetching Notion pages:", error.message);
    } else {
      console.error("Error fetching Notion pages:", error);
    }
    return [];
  }
}

// New function to get child databases
async function getNotionDatabases(id: string): Promise<PageDetails[]> {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: id,
      page_size: 100,
    });

    const childDatabases = blocks.results.filter(
      (block) => (block as BlockObjectResponse).type === "child_database",
    ) as BlockObjectResponse[];

    const databasesWithDetails = await Promise.all(
      childDatabases.map(async (database) => {
        const databaseId = database.id;

        // Get the database details
        const databaseDetails = (await notion.databases.retrieve({
          database_id: databaseId,
        })) as unknown as {
          id: string;
          title: Array<{ plain_text: string }>;
          icon?: {
            type: string;
            emoji?: string;
          } | null;
          public_url?: string | null;
        };

        // Extract title from database details
        const title =
          databaseDetails.title?.length > 0
            ? databaseDetails.title.map((t) => t.plain_text).join("")
            : "Untitled Database";

        // Get the icon (emoji) from the database details
        let icon: string | null = null;
        if (
          databaseDetails.icon &&
          databaseDetails.icon.type === "emoji" &&
          databaseDetails.icon.emoji
        ) {
          icon = databaseDetails.icon.emoji;
        }

        return {
          id: databaseId,
          title,
          icon,
          publicUrl: databaseDetails.public_url ?? null,
          iconUrl: null,
        };
      }),
    );

    return databasesWithDetails;
  } catch (error) {
    if (isNotionClientError(error)) {
      console.error("Error fetching Notion databases:", error.message);
    } else {
      console.error("Error fetching Notion databases:", error);
    }
    return [];
  }
}

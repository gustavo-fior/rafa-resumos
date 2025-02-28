import { Client, isNotionClientError, LogLevel } from "@notionhq/client";
import { env } from "~/env";

// Initialize the Notion client
const notion = new Client({
  auth: env.NOTION_API_KEY,
  logLevel: LogLevel.DEBUG,
});

export async function getNotionPages() {
  try {
    const response = await notion.search({
      filter: {
        value: "page",
        property: "object",
      },
    });

    const users = await notion.users.list({});  

    const pages = await notion.pages.retrieve({
      page_id: "143fbe83ff3b80b29b8fd9d48281cfe6",
    });

    console.log(response.results);
    console.log(users);
    console.log(pages);

    return response.results;
  } catch (error) {
    if (isNotionClientError(error)) {
      console.error("Error fetching Notion pages:", error.message);
    } else {
      console.error("Error fetching Notion pages:", error);
    }
    return [];
  }
} 
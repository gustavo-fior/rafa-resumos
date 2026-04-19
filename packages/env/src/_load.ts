import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

for (const envPath of [
  resolve(currentDir, "../../../apps/server/.env"),
  resolve(process.cwd(), "apps/server/.env"),
  resolve(process.cwd(), ".env"),
]) {
  dotenv.config({ path: envPath, override: false });
}

import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";

if (process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof drizzle> };
export const db = globalForDb.__db ?? drizzle(sql, { schema });
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

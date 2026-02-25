import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

function makeDb() {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

type DrizzleDb = ReturnType<typeof makeDb>;

// Prevent multiple instances in development (Next.js hot reload)
const globalForDb = global as unknown as { db: DrizzleDb };

export const db: DrizzleDb = globalForDb.db ?? makeDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

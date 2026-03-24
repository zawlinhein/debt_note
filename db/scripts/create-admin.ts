import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../schema";

async function createAdmin() {
  const client = neon(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, "admin"))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    console.log("Admin user already exists, skipping");
    return;
  }

  const hash = await bcrypt.hash("changeme", 12);
  await db.insert(users).values({ username: "admin", password: hash });
  console.log("Admin user created (username: admin, password: changeme)");
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});

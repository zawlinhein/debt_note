import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import {
  friends,
  groups,
  groupMembers,
  purchases,
  lineItems,
  purchaseParticipants,
  debts,
  payments,
} from "../schema";

export async function clearData() {
  const client = neon(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // Delete in dependency order
  await db.delete(payments);
  await db.delete(debts);
  await db.delete(purchaseParticipants);
  await db.delete(lineItems);
  await db.delete(purchases);
  await db.delete(groupMembers);
  await db.delete(groups);
  await db.delete(friends);

  // Reset sequences
  await db.execute(sql`ALTER SEQUENCE friends_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE groups_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE purchases_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE line_items_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE purchase_participants_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE debts_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE payments_id_seq RESTART WITH 1`);

  console.log("All data cleared");
}

// Run directly: tsx db/scripts/clear.ts
if (require.main === module) {
  clearData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

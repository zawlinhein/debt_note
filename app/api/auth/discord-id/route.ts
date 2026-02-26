import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db
    .select({ discordId: users.discordId })
    .from(users)
    .where(eq(users.username, session.user.name))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ discordId: user.discordId });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const discordId =
    body.discordId === null || body.discordId === ""
      ? null
      : String(body.discordId).trim();

  try {
    const [updated] = await db
      .update(users)
      .set({ discordId, updatedAt: new Date() })
      .where(eq(users.username, session.user.name))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ discordId: updated.discordId });
  } catch {
    return NextResponse.json(
      { error: "Discord ID is already in use" },
      { status: 409 },
    );
  }
}

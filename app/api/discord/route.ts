import { NextRequest, NextResponse } from "next/server";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  verifyKey,
} from "discord-interactions";
import { db } from "@/db";
import { friends, debts, payments } from "@/db/schema";
import { eq, sum } from "drizzle-orm";

// ─── Discord signature verification ──────────────────────────────────────────

async function verifyDiscordRequest(req: NextRequest): Promise<{
  isValid: boolean;
  body: string;
}> {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const body = await req.text();

  if (!signature || !timestamp) {
    return { isValid: false, body };
  }

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error("DISCORD_PUBLIC_KEY not set");
    return { isValid: false, body };
  }

  const isValid = await verifyKey(body, signature, timestamp, publicKey);
  return { isValid, body };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ephemeral(content: string) {
  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: InteractionResponseFlags.EPHEMERAL,
    },
  });
}

async function getFriendByDiscordId(discordId: string) {
  return db.query.friends.findFirst({
    where: eq(friends.discordId, discordId),
  });
}

async function getFriendBalance(friendId: number) {
  const [owed] = await db
    .select({ total: sum(debts.amount) })
    .from(debts)
    .where(eq(debts.friendId, friendId));
  const [paid] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(eq(payments.friendId, friendId));

  const totalOwed = Number(owed?.total ?? 0);
  const totalPaid = Number(paid?.total ?? 0);
  return { totalOwed, totalPaid, remaining: totalOwed - totalPaid };
}

// ─── Command handlers ────────────────────────────────────────────────────────

async function handlePay(
  discordUserId: string,
  options: Array<{ name: string; value: unknown }>,
) {
  const friend = await getFriendByDiscordId(discordUserId);
  if (!friend) {
    return ephemeral("You're not authorized to use this bot.");
  }

  const amountOpt = options.find((o) => o.name === "amount");
  const amount = Number(amountOpt?.value);
  if (!amount || amount <= 0) {
    return ephemeral("Please provide a valid positive amount.");
  }

  // Record the payment
  const [payment] = await db
    .insert(payments)
    .values({
      friendId: friend.id,
      amount: amount.toFixed(2),
      note: "Paid via Discord",
      paidAt: new Date().toISOString().split("T")[0],
    })
    .returning();

  const balance = await getFriendBalance(friend.id);

  return ephemeral(
    `Recorded payment of **$${Number(payment.amount).toFixed(2)}** from ${friend.name}.\n` +
      `Remaining balance: **$${balance.remaining.toFixed(2)}**`,
  );
}

async function handleAsk(discordUserId: string) {
  const friend = await getFriendByDiscordId(discordUserId);
  if (!friend) {
    return ephemeral("You're not authorized to use this bot.");
  }

  const { totalOwed, totalPaid, remaining } = await getFriendBalance(friend.id);

  let status: string;
  if (remaining > 0) {
    status = `You owe **$${remaining.toFixed(2)}**`;
  } else if (remaining < 0) {
    status = `You are overpaid by **$${Math.abs(remaining).toFixed(2)}**`;
  } else {
    status = "You're all settled up!";
  }

  return ephemeral(
    `**${friend.name}'s Balance**\n` +
      `Total owed: $${totalOwed.toFixed(2)}\n` +
      `Total paid: $${totalPaid.toFixed(2)}\n` +
      `${status}`,
  );
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Verify Discord signature
  const { isValid, body } = await verifyDiscordRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const interaction = JSON.parse(body);

  // 2. Handle PING (Discord endpoint verification)
  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  // 3. Handle Application Commands
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const discordUserId: string =
      interaction.member?.user?.id ?? interaction.user?.id;

    if (!discordUserId) {
      return ephemeral("Could not identify user.");
    }

    const commandName: string = interaction.data.name;
    const options: Array<{ name: string; value: unknown }> =
      interaction.data.options ?? [];

    switch (commandName) {
      case "pay":
        return handlePay(discordUserId, options);
      case "ask":
        return handleAsk(discordUserId);
      default:
        return ephemeral(`Unknown command: /${commandName}`);
    }
  }

  // Unhandled interaction type
  return ephemeral("Unsupported interaction type.");
}

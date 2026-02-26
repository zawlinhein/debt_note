import { NextRequest, NextResponse } from "next/server";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  verifyKey,
} from "discord-interactions";
import { db } from "@/db";
import { friends, debts, payments, users } from "@/db/schema";
import { eq, sum, and, gt } from "drizzle-orm";

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

// ─── FIFO unpaid debts calculation ────────────────────────────────────────────

interface UnpaidItem {
  date: string;
  title: string;
  originalAmount: number;
  remaining: number;
  partial: boolean;
}

async function getUnpaidDebts(friendId: number): Promise<{
  items: UnpaidItem[];
  totalRemaining: number;
}> {
  // Get the friend's settled_at marker
  const friend = await db.query.friends.findFirst({
    where: eq(friends.id, friendId),
  });
  const settledAt = friend?.settledAt ?? null;

  // Build conditions: only fetch debts/payments after the settlement point
  const debtConditions = settledAt
    ? and(eq(debts.friendId, friendId), gt(debts.createdAt, settledAt))
    : eq(debts.friendId, friendId);

  const paymentConditions = settledAt
    ? and(eq(payments.friendId, friendId), gt(payments.createdAt, settledAt))
    : eq(payments.friendId, friendId);

  // Fetch debts with purchase info, ordered by purchase date ASC (FIFO)
  const friendDebts = await db.query.debts.findMany({
    where: debtConditions,
    with: { purchase: true },
    orderBy: (d, { asc }) => [asc(d.createdAt)],
  });

  // Get total payments since settlement
  const [paidResult] = await db
    .select({ total: sum(payments.amount) })
    .from(payments)
    .where(paymentConditions);

  let totalPaid = Number(paidResult?.total ?? 0);

  // Walk debts FIFO, subtracting payments
  const items: UnpaidItem[] = [];
  let totalRemaining = 0;

  for (const d of friendDebts) {
    const debtAmount = Number(d.amount);

    if (totalPaid >= debtAmount) {
      // This debt is fully covered by payments
      totalPaid -= debtAmount;
      continue;
    }

    // This debt is partially or fully unpaid
    const remaining = debtAmount - totalPaid;
    const partial = totalPaid > 0;
    totalPaid = 0;

    items.push({
      date: d.purchase.date,
      title: d.purchase.title,
      originalAmount: debtAmount,
      remaining,
      partial,
    });

    totalRemaining += remaining;
  }

  return { items, totalRemaining };
}

function formatUnpaidList(items: UnpaidItem[]): string {
  return items
    .map(
      (item) =>
        `${item.date} · ${item.title} — ${item.remaining.toFixed(2)}${item.partial ? " (partially paid)" : ""}`,
    )
    .join("\n");
}

// ─── Settlement logic ─────────────────────────────────────────────────────────

async function trySettle(friendId: number): Promise<boolean> {
  const { totalRemaining } = await getUnpaidDebts(friendId);
  if (totalRemaining === 0) {
    await db
      .update(friends)
      .set({ settledAt: new Date() })
      .where(eq(friends.id, friendId));
    return true;
  }
  return false;
}

// ─── DM the admin ─────────────────────────────────────────────────────────────

async function dmAdmin(message: string): Promise<boolean> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.error("DISCORD_BOT_TOKEN not set, cannot DM admin");
    return false;
  }

  // Get admin's Discord ID from the users table
  const admin = await db.query.users.findFirst();
  if (!admin?.discordId) {
    console.error("Admin Discord ID not configured");
    return false;
  }

  try {
    // Create DM channel
    const channelRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${botToken}`,
      },
      body: JSON.stringify({ recipient_id: admin.discordId }),
    });

    if (!channelRes.ok) {
      console.error(`Failed to create DM channel: ${channelRes.status}`);
      return false;
    }

    const channel = await channelRes.json();

    // Send message
    const msgRes = await fetch(
      `https://discord.com/api/v10/channels/${channel.id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify({ content: message }),
      },
    );

    if (!msgRes.ok) {
      console.error(`Failed to send DM: ${msgRes.status}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to DM admin:", err);
    return false;
  }
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

  // Check remaining balance before recording
  const { totalRemaining } = await getUnpaidDebts(friend.id);

  if (totalRemaining === 0) {
    return ephemeral("You have no outstanding debts.");
  }

  if (amount > totalRemaining) {
    return ephemeral(
      `Your remaining balance is ${totalRemaining.toFixed(2)}. You cannot pay more than that.`,
    );
  }

  // Record the payment
  await db.insert(payments).values({
    friendId: friend.id,
    amount: amount.toFixed(2),
    note: "Paid via Discord",
    paidAt: new Date().toISOString().split("T")[0],
  });

  // Check if fully settled
  const settled = await trySettle(friend.id);

  if (settled) {
    return ephemeral(
      `Payment of ${amount.toFixed(2)} recorded. You're all settled up!`,
    );
  }

  // Show remaining debts
  const { items, totalRemaining: remaining } = await getUnpaidDebts(friend.id);
  const list = formatUnpaidList(items);

  return ephemeral(
    `Payment of ${amount.toFixed(2)} recorded.\n\n` +
      `Remaining debts:\n${list}\n` +
      `─────\n` +
      `Total remaining: ${remaining.toFixed(2)}`,
  );
}

async function handleAsk(discordUserId: string) {
  const friend = await getFriendByDiscordId(discordUserId);
  if (!friend) {
    return ephemeral("You're not authorized to use this bot.");
  }

  const { items, totalRemaining } = await getUnpaidDebts(friend.id);

  if (totalRemaining === 0) {
    return ephemeral("You're all settled up! No outstanding debts.");
  }

  const list = formatUnpaidList(items);

  return ephemeral(
    `Your unpaid debts:\n${list}\n` +
      `─────\n` +
      `Total remaining: ${totalRemaining.toFixed(2)}`,
  );
}

async function handleOwe(
  discordUserId: string,
  options: Array<{ name: string; value: unknown }>,
) {
  const friend = await getFriendByDiscordId(discordUserId);
  if (!friend) {
    return ephemeral("You're not authorized to use this bot.");
  }

  const amountOpt = options.find((o) => o.name === "amount");
  const oweAmount = Number(amountOpt?.value);
  if (!oweAmount || oweAmount <= 0) {
    return ephemeral("Please provide a valid positive amount.");
  }

  const { totalRemaining } = await getUnpaidDebts(friend.id);

  if (totalRemaining === 0) {
    // Friend has no debt -- admin just owes them the full amount
    await dmAdmin(
      `**${friend.name}** says you owe them **${oweAmount.toFixed(2)}**. They have no outstanding debts.`,
    );
    return ephemeral(
      `You have no outstanding debts.\n` +
        `Admin has been notified that they owe you ${oweAmount.toFixed(2)}.`,
    );
  }

  if (oweAmount >= totalRemaining) {
    // Owe amount exceeds or equals remaining debt -- clear all debt
    // Record payment only for the remaining debt amount to settle
    await db.insert(payments).values({
      friendId: friend.id,
      amount: totalRemaining.toFixed(2),
      note: "Owed via Discord",
      paidAt: new Date().toISOString().split("T")[0],
    });

    await trySettle(friend.id);

    const excess = oweAmount - totalRemaining;

    if (excess > 0) {
      await dmAdmin(
        `**${friend.name}** says you owe them **${excess.toFixed(2)}**. ` +
          `Their previous debt of ${totalRemaining.toFixed(2)} has been cleared.`,
      );
      return ephemeral(
        `Your debt of ${totalRemaining.toFixed(2)} has been cleared.\n` +
          `Admin has been notified that they owe you ${excess.toFixed(2)}.`,
      );
    }

    // Exact match -- debt fully cleared, no excess
    return ephemeral(
      `Your debt of ${totalRemaining.toFixed(2)} has been cleared. You're all settled up!`,
    );
  }

  // Owe amount is less than remaining debt -- partial offset
  await db.insert(payments).values({
    friendId: friend.id,
    amount: oweAmount.toFixed(2),
    note: "Owed via Discord",
    paidAt: new Date().toISOString().split("T")[0],
  });

  await trySettle(friend.id);

  const { items, totalRemaining: remaining } = await getUnpaidDebts(friend.id);
  const list = formatUnpaidList(items);

  return ephemeral(
    `Recorded: ${oweAmount.toFixed(2)} offset from your balance.\n\n` +
      `Remaining debts:\n${list}\n` +
      `─────\n` +
      `Total remaining: ${remaining.toFixed(2)}`,
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
      case "owe":
        return handleOwe(discordUserId, options);
      default:
        return ephemeral(`Unknown command: /${commandName}`);
    }
  }

  // Unhandled interaction type
  return ephemeral("Unsupported interaction type.");
}

import "dotenv/config";

/**
 * Register Discord slash commands for the DebtNote bot.
 *
 * Usage:  npx tsx db/scripts/register-discord-commands.ts
 *
 * Requires env vars: DISCORD_APP_ID, DISCORD_BOT_TOKEN
 * Optionally: DISCORD_GUILD_ID (for guild-scoped commands during dev)
 */

const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!APP_ID || !BOT_TOKEN) {
  console.error("Missing DISCORD_APP_ID or DISCORD_BOT_TOKEN");
  process.exit(1);
}

const commands = [
  {
    name: "pay",
    description: "Record a payment you've made",
    type: 1, // CHAT_INPUT
    options: [
      {
        name: "amount",
        description: "Amount you're paying (e.g. 25.50)",
        type: 10, // NUMBER
        required: true,
        min_value: 0.01,
      },
    ],
  },
  {
    name: "ask",
    description: "Check your current balance",
    type: 1, // CHAT_INPUT
  },
  {
    name: "owe",
    description: "Record an amount the admin owes you",
    type: 1, // CHAT_INPUT
    options: [
      {
        name: "amount",
        description: "Amount the admin owes you (e.g. 20.00)",
        type: 10, // NUMBER
        required: true,
        min_value: 0.01,
      },
    ],
  },
];

async function main() {
  // Use guild-scoped URL for dev (instant), global URL for production (up to 1hr cache)
  const url = GUILD_ID
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  console.log(
    `Registering ${commands.length} commands ${GUILD_ID ? `for guild ${GUILD_ID}` : "globally"}...`,
  );

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${BOT_TOKEN}`,
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed (${res.status}): ${text}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`Successfully registered ${data.length} commands:`);
  for (const cmd of data) {
    console.log(`  /${cmd.name} (id: ${cmd.id})`);
  }
}

main();

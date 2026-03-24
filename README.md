# DebtNote

DebtNote is a personal web app for tracking shared purchases and repayments with friends.

## Features

- Track purchases with receipt-style line items
- Split costs with friends using:
  - equal split
  - percentage split
  - ratio split
- Organize friends into reusable groups
- Record payments and track remaining balances
- View friend-level history (purchases + payments)
- Discord slash command integration for friend self-service (`/ask`, `/pay`, `/owe`)

## Tech Stack

- Next.js 16
- TypeScript
- PostgreSQL
- Drizzle ORM + drizzle-kit
- NextAuth
- Tailwind CSS v4
- Discord Interactions API

## Requirements

- Node.js 20+
- Neon PostgreSQL database

## Environment Variables

Copy `.env.example` to `.env.local` (or `.env`) and fill in values:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Discord Bot
DISCORD_PUBLIC_KEY=...
DISCORD_APP_ID=...
DISCORD_BOT_TOKEN=...
# Optional (faster command registration during development)
# DISCORD_GUILD_ID=...
```

## Database & Scripts

### App scripts

- `npm run dev` - run development server
- `npm run build` - build for production
- `npm run start` - start production server

### Database scripts

- `npm run db:generate` - generate Drizzle migrations
- `npm run db:migrate` - run migrations from `db/migrations`
- `npm run db:push` - push schema directly to database
- `npm run db:clear` - clear all app data and reset sequences
- `npm run db:create-admin` - create default admin if missing

### Discord scripts

- `npm run discord:register` - register slash commands with Discord API

## Discord Integration

DebtNote exposes a Discord interaction endpoint at:

- `POST /api/discord`

Supported slash commands:

- `/ask` - show your current unpaid items and total
- `/pay amount:<number>` - record a payment
- `/owe amount:<number>` - report amount the admin owes you (or offset your debt)

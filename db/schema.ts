import {
  pgTable,
  serial,
  text,
  numeric,
  date,
  timestamp,
  integer,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Friends ────────────────────────────────────────────────────────────────

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  discordId: text("discord_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendsRelations = relations(friends, ({ many }) => ({
  groupMembers: many(groupMembers),
  purchaseParticipants: many(purchaseParticipants),
  debts: many(debts),
  payments: many(payments),
}));

// ─── Groups ──────────────────────────────────────────────────────────────────

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupsRelations = relations(groups, ({ many }) => ({
  groupMembers: many(groupMembers),
}));

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    friendId: integer("friend_id")
      .notNull()
      .references(() => friends.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.friendId] })]
);

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  friend: one(friends, { fields: [groupMembers.friendId], references: [friends.id] }),
}));

// ─── Purchases ───────────────────────────────────────────────────────────────

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  note: text("note"),
  date: date("date").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchasesRelations = relations(purchases, ({ many }) => ({
  lineItems: many(lineItems),
  participants: many(purchaseParticipants),
  debts: many(debts),
}));

// ─── Line Items ──────────────────────────────────────────────────────────────

export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [lineItems.purchaseId],
    references: [purchases.id],
  }),
}));

// ─── Purchase Participants ────────────────────────────────────────────────────

export const purchaseParticipants = pgTable(
  "purchase_participants",
  {
    id: serial("id").primaryKey(),
    purchaseId: integer("purchase_id")
      .notNull()
      .references(() => purchases.id, { onDelete: "cascade" }),
    friendId: integer("friend_id")
      .notNull()
      .references(() => friends.id, {
      onDelete: "cascade",
    }),
  },
  (t) => [uniqueIndex("uq_purchase_participant").on(t.purchaseId, t.friendId)]
);

export const purchaseParticipantsRelations = relations(
  purchaseParticipants,
  ({ one }) => ({
    purchase: one(purchases, {
      fields: [purchaseParticipants.purchaseId],
      references: [purchases.id],
    }),
    friend: one(friends, {
      fields: [purchaseParticipants.friendId],
      references: [friends.id],
    }),
  })
);

// ─── Debts ───────────────────────────────────────────────────────────────────

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  friendId: integer("friend_id")
    .notNull()
    .references(() => friends.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const debtsRelations = relations(debts, ({ one }) => ({
  purchase: one(purchases, {
    fields: [debts.purchaseId],
    references: [purchases.id],
  }),
  friend: one(friends, {
    fields: [debts.friendId],
    references: [friends.id],
  }),
}));

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  friendId: integer("friend_id")
    .notNull()
    .references(() => friends.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  paidAt: date("paid_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  friend: one(friends, {
    fields: [payments.friendId],
    references: [friends.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Friend = typeof friends.$inferSelect;
export type NewFriend = typeof friends.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type LineItem = typeof lineItems.$inferSelect;
export type NewLineItem = typeof lineItems.$inferInsert;
export type PurchaseParticipant = typeof purchaseParticipants.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

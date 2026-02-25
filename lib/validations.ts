import { z } from "zod";

// ─── Shared ──────────────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  name: z.string().min(1, "Line item name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
});

// ─── Purchases ───────────────────────────────────────────────────────────────

export const createPurchaseSchema = z.object({
  title: z.string().min(1, "Title is required").transform((s) => s.trim()),
  note: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  lineItemsInput: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
  friendIds: z
    .array(z.number().int().positive())
    .min(1, "At least one friend must participate"),
});

export const updatePurchaseSchema = createPurchaseSchema;

// ─── Friends ─────────────────────────────────────────────────────────────────

export const createFriendSchema = z.object({
  name: z.string().min(1, "Name is required").transform((s) => s.trim()),
  discordId: z
    .string()
    .transform((s) => s.trim())
    .optional(),
});

// ─── Groups ──────────────────────────────────────────────────────────────────

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").transform((s) => s.trim()),
  friendIds: z.array(z.number().int().positive()).optional(),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((s) => s.trim())
    .optional(),
  friendIds: z.array(z.number().int().positive()).optional(),
});

// ─── Payments ────────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  friendId: z.number().int().positive("Friend is required"),
  amount: z.number().positive("Amount must be positive"),
  note: z.string().optional(),
  paidAt: z.string().optional(),
});

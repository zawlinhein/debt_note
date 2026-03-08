/**
 * Shared business logic helpers
 */

export type SplitMethod = "equal" | "percentage" | "ratio";

/** Round a number to the nearest integer */
export function roundInt(value: number): number {
  return Math.round(value);
}

/** Compute per-person share: total / n participants, rounded to nearest integer */
export function perPersonShare(total: number, nParticipants: number): number {
  return roundInt(total / nParticipants);
}

/**
 * Compute per-friend debts using percentage split.
 * `percentages` maps participant key ("you" | friendId) to their percentage.
 * Returns a map of friendId -> debt amount (excludes "you").
 */
export function percentageSplit(
  total: number,
  percentages: Record<string, number>,
  friendIds: number[]
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const fid of friendIds) {
    const pct = percentages[String(fid)] ?? 0;
    result[fid] = roundInt((total * pct) / 100);
  }
  return result;
}

/**
 * Compute per-friend debts using ratio split.
 * `ratios` maps participant key ("you" | friendId) to their ratio number.
 * Returns a map of friendId -> debt amount (excludes "you").
 */
export function ratioSplit(
  total: number,
  ratios: Record<string, number>,
  friendIds: number[]
): Record<number, number> {
  const totalRatio = Object.values(ratios).reduce((s, r) => s + r, 0);
  if (totalRatio <= 0) {
    // Fallback to equal split
    const share = perPersonShare(total, friendIds.length + 1);
    const result: Record<number, number> = {};
    for (const fid of friendIds) result[fid] = share;
    return result;
  }
  const result: Record<number, number> = {};
  for (const fid of friendIds) {
    const r = ratios[String(fid)] ?? 0;
    result[fid] = roundInt((total * r) / totalRatio);
  }
  return result;
}

/**
 * Compute debts for any split method.
 * Returns a map of friendId -> debt amount.
 */
export function computeDebts(
  total: number,
  friendIds: number[],
  splitMethod: SplitMethod,
  splitValues?: Record<string, number>
): Record<number, number> {
  if (splitMethod === "percentage" && splitValues) {
    return percentageSplit(total, splitValues, friendIds);
  }
  if (splitMethod === "ratio" && splitValues) {
    return ratioSplit(total, splitValues, friendIds);
  }
  // Default: equal split
  const share = perPersonShare(total, friendIds.length + 1);
  const result: Record<number, number> = {};
  for (const fid of friendIds) result[fid] = share;
  return result;
}

/** Format a numeric string or number as a whole integer (no decimals) */
export function fmt(value: string | number): string {
  return Math.round(Number(value)).toFixed(0);
}

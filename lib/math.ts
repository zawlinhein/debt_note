/**
 * Shared business logic helpers
 */

/** Round a number to the nearest integer */
export function roundInt(value: number): number {
  return Math.round(value);
}

/** Compute per-person share: total / n participants, rounded to nearest integer */
export function perPersonShare(total: number, nParticipants: number): number {
  return roundInt(total / nParticipants);
}

/** Format a numeric string or number as a whole integer (no decimals) */
export function fmt(value: string | number): string {
  return Math.round(Number(value)).toFixed(0);
}

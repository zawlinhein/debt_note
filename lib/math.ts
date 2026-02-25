/**
 * Shared business logic helpers
 */

/** Round a number up to 2 decimal places (ceiling per cent) */
export function ceilCents(value: number): number {
  return Math.ceil(value * 100) / 100;
}

/** Compute per-person share: total / n participants, ceiling rounded */
export function perPersonShare(total: number, nParticipants: number): number {
  return ceilCents(total / nParticipants);
}

/** Format a numeric string or number to 2dp display */
export function fmt(value: string | number): string {
  return Number(value).toFixed(2);
}

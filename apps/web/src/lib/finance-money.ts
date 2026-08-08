/**
 * NAVEMORA Finance 2.0 money primitives.
 *
 * Authoritative money values are integer minor units (e.g. INR paise, USD
 * cents). Binary floating-point is never used for authoritative totals or
 * balances — the helpers below centralize conversion and deterministic
 * rounding so the frontend and backend can never derive different totals.
 *
 * This module is intentionally client-safe (pure math/formatting only):
 * client components display server-derived minor-unit values through these
 * helpers, while the authoritative engine (finance-operations.ts) stays
 * server-only.
 */

export type MoneyMinor = number;

/** Converts a decimal amount string/number to minor units using exact decimal parsing. */
export function toMinor(value: number | string): MoneyMinor {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Invalid monetary value.');
    return Math.round(value * 100);
  }
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) throw new Error('Invalid monetary amount format.');
  const [whole, fraction = ''] = trimmed.split('.');
  const sign = whole.startsWith('-') ? -1 : 1;
  const digits = `${whole.replace(/^-/, '')}${fraction.padEnd(2, '0')}`;
  return sign * Number(digits);
}

/** Converts minor units back to a decimal number for display only. */
export function fromMinor(minor: MoneyMinor): number {
  return minor / 100;
}

/**
 * Deterministic half-away-from-zero rounding to the nearest minor unit
 * (no banker's rounding, no floating-point surprises for negative values).
 */
export function roundMinor(value: number): MoneyMinor {
  if (!Number.isFinite(value)) throw new Error('Invalid monetary value.');
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Percentage of a minor-unit amount, deterministically rounded half-up. */
export function percentageOfMinor(amountMinor: MoneyMinor, percentage: number): MoneyMinor {
  if (!Number.isFinite(percentage) || percentage < 0) throw new Error('Invalid percentage.');
  return roundMinor((amountMinor * percentage) / 100);
}

/**
 * Applies a cap to a computed discount amount. A cap of 0 means no cap.
 */
export function applyCap(amountMinor: MoneyMinor, capMinor: MoneyMinor): MoneyMinor {
  if (capMinor <= 0) return amountMinor;
  return Math.min(amountMinor, capMinor);
}

/** Clamps a payable to zero — payable can never become negative. */
export function nonNegativeMinor(value: MoneyMinor): MoneyMinor {
  return Math.max(0, value);
}

export function addMinor(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  return a + b;
}

export function subtractMinor(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  return a - b;
}

export function sumMinor(values: Array<MoneyMinor | null | undefined>): MoneyMinor {
  return values.reduce<MoneyMinor>((total, value) => total + (value ?? 0), 0);
}

/**
 * Splits a total into `count` installments deterministically. Any rounding
 * remainder is absorbed by the final installment so the parts always sum to
 * the original total.
 */
export function splitIntoInstallments(totalMinor: MoneyMinor, count: number): MoneyMinor[] {
  if (count < 1) throw new Error('Installment count must be at least 1.');
  if (totalMinor < 0) throw new Error('Total must be non-negative.');
  if (count === 1) return [totalMinor];
  const base = Math.floor(totalMinor / count);
  const parts: MoneyMinor[] = Array(count).fill(base);
  parts[count - 1] += totalMinor - base * count;
  return parts;
}

export function currencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'EUR':
      return '€';
    case 'AED':
      return 'د.إ';
    default:
      return `${currency} `;
  }
}

/** Displays minor units as a localized currency string (display only). */
export function formatMinor(amountMinor: MoneyMinor, currency = 'INR'): string {
  return `${currencySymbol(currency)}${(amountMinor / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

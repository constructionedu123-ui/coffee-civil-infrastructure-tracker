/**
 * Format IDR budget in Trillions (e.g., Rp 8,51 Triliun or Rp 197,59 Triliun).
 */
export function formatBudget(budgetTrillions: number | null, rawFallback?: string | null): string {
  if (budgetTrillions === null || budgetTrillions === undefined) {
    if (rawFallback && rawFallback.trim() !== '') {
      return rawFallback;
    }
    return 'Estimating';
  }

  // Indonesian locale formatting with comma for decimals
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(budgetTrillions);

  return `Rp ${formatted} T`;
}

/**
 * Format full IDR currency if displayed as number.
 */
export function formatCurrencyFull(budgetTrillions: number | null): string {
  if (!budgetTrillions) return 'Rp 0';
  const fullIdr = budgetTrillions * 1_000_000_000_000;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(fullIdr);
}

/**
 * Format date string.
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

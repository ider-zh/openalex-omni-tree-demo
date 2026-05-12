/**
 * Number formatting with K/M suffixes
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString();
}

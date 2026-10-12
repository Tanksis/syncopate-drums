// A percent typed into a field: the precise way to set a volume or the swing.

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/

/**
 * The value typed as `text`, in percent, clamped to the range. "85", "85%" and "66.7" are read;
 * empty or non-numeric text gives back `previous`.
 */
export function parsePercent(text: string, { min, max, previous }: { min: number; max: number; previous: number }): number {
  const digits = text.trim().replace(/\s*%$/, '')
  if (!NUMBER.test(digits)) return previous
  return Math.min(max, Math.max(min, Number(digits)))
}

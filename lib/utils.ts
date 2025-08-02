import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge a list of class names using `clsx` and `tailwind-merge`.
 *
 * This helper is primarily used to conditionally apply Tailwind CSS classes
 * while ensuring that conflicting classes are resolved in a predictable way.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number to a fixed number of significant figures.
 *
 * Non-finite values such as `Infinity` or `NaN` are returned as strings
 * unchanged to avoid formatting errors.
 *
 * @param value The numeric value to format.
 * @param sig The number of significant figures to display. Defaults to 3.
 */
export function formatSigFig(value: number, sig = 3): string {
  if (!isFinite(value)) return String(value)
  return Number(value.toPrecision(sig)).toString()
}

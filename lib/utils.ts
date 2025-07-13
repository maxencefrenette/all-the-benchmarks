import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSigFig(value: number, sig = 3): string {
  if (!isFinite(value)) return String(value)
  return Number(value.toPrecision(sig)).toString()
}

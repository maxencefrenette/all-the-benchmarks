export function computeCostDomain(values: number[]): [number, number] {
  const FACTOR = 1.2
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value > 0) {
      if (value < min) min = value
      if (value > max) max = value
    }
  }
  if (!isFinite(min) || !isFinite(max)) return [0, 1]
  return [min / FACTOR, max * FACTOR]
}

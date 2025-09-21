// z-scores for common two-sided confidence levels
const Z: Record<number, number> = {
  0.80: 1.2815515655446004,
  0.90: 1.6448536269514722,
  0.95: 1.959963984540054,
  0.98: 2.3263478740408408,
  0.99: 2.5758293035489004
};

export function zFromConfidence(confidence: number): number {
  const z = Z[confidence];
  if (!z) throw new Error(`Unsupported confidence level: ${confidence}`);
  return z;
}

/**
 * Wald CI for a proportion (with optional finite population correction).
 *  moe = z * sqrt(p*(1-p)/n) * sqrt((N - n)/(N - 1))   [if FPC enabled]
 */
export function waldCI(
  p: number,               // observed/assumed proportion in [0,1]
  n: number,               // sample size
  N?: number,              // population size (optional, for FPC)
  confidence = 0.95,
  useFpc = true
): { lower: number; upper: number; moeAbs: number; moeRel: number; z: number } {
  const z = zFromConfidence(confidence);
  if (n <= 0) return { lower: 0, upper: 0, moeAbs: 0, moeRel: 0, z };

  const base = Math.sqrt((p * (1 - p)) / n);
  const fpc = useFpc && N !== undefined && N > 1 ? Math.sqrt((N - n) / (N - 1)) : 1;

  const moe = z * base * fpc;
  const lower = Math.max(0, p - moe);
  const upper = Math.min(1, p + moe);
  const moeRel = p > 0 ? moe / p : Infinity;

  return { lower, upper, moeAbs: moe, moeRel, z };
}

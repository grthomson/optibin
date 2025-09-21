export type StratumRow = {
  stratum_id: number | string;
  stratum_size: number;
  /** Optional: expected number of errors in the stratum (for p-hat). */
  expected_error_count?: number;
};

/**
 * Neyman-style allocation with stratum caps + iterative reallocation.
 * - Census if totalSampleSize >= total population.
 * - If expected_error_count missing for ALL rows ⇒ p=0.5 (proportional fallback).
 * - Otherwise p_h = expected_error_count / stratum_size (clamped to [0,1]).
 * - Weight_h = N_h * sqrt(p_h * (1 - p_h)).
 * - Math.round; no drift fix (to mirror typical Python round behavior).
 */
export function neymanAllocate(
  strata: StratumRow[],
  totalSampleSize: number
): Record<string | number, number> {
  if (strata.length === 0) return {};

  const sizes = new Map(strata.map(s => [s.stratum_id, s.stratum_size]));
  const totalPop = [...sizes.values()].reduce((a, b) => a + b, 0);

  // Census case
  if (totalSampleSize >= totalPop) {
    const out: Record<string | number, number> = {};
    for (const s of strata) out[s.stratum_id] = s.stratum_size;
    return out;
  }

  const hasErrCol = strata.some(s => s.expected_error_count !== undefined);

  // p-hat per stratum
  const pHat = new Map<string | number, number>();
  for (const s of strata) {
    const p = hasErrCol
      ? Math.max(0, Math.min(1, (s.expected_error_count ?? 0) / Math.max(1, s.stratum_size)))
      : 0.5;
    pHat.set(s.stratum_id, p);
  }

  let remaining = totalSampleSize;
  const allIds = new Set(strata.map(s => s.stratum_id));
  const filled = new Set<string | number>();
  const alloc: Record<string | number, number> = {};

  while (true) {
    const unfilled = [...allIds].filter(id => !filled.has(id));

    // weights for unfilled
    let sumW = 0;
    const weights = new Map<string | number, number>();
    for (const id of unfilled) {
      const N = sizes.get(id)!;
      const p = pHat.get(id)!;
      const w = N * Math.sqrt(p * (1 - p));
      weights.set(id, w);
      sumW += w;
    }

    // if all weights zero (all p in {0,1}), fall back to proportional by size
    if (sumW === 0) {
      sumW = 0;
      for (const id of unfilled) {
        const w = sizes.get(id)!;
        weights.set(id, w);
        sumW += w;
      }
    }

    // allocate among unfilled
    for (const id of unfilled) {
      const w = weights.get(id)!;
      alloc[id] = Math.round((remaining * w) / sumW);
    }

    // cap any overfilled strata
    const overfilled = unfilled.filter(id => alloc[id] > sizes.get(id)!);
    if (overfilled.length === 0) break;

    for (const id of overfilled) alloc[id] = sizes.get(id)!;

    // mark filled (exactly at size)
    for (const id of unfilled) {
      if (alloc[id] === sizes.get(id)!) filled.add(id);
    }

    // recompute remaining
    const filledTotal = [...filled].reduce((a, id) => a + alloc[id], 0);
    remaining = totalSampleSize - filledTotal;
    if (remaining <= 0) break;
  }

  return alloc;
}

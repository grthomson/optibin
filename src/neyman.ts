export type StratumRow = {
  stratum_id: number | string;
  stratum_size: number;
  /** Optional: expected number of errors in the stratum (for p-hat). */
  expected_error_count?: number;
};

/**
 * Neyman-style allocation with stratum caps + iterative reallocation.
 */
export function neymanAllocate(
  strata: StratumRow[],
  totalSampleSize: number
): Record<string, number> {
  if (strata.length === 0) return {};

  // 🔑 normalize all IDs to string once
  const normStrata = strata.map(s => ({
    id: String(s.stratum_id),
    N: s.stratum_size,
    expected_error_count: s.expected_error_count,
  }));

  const sizes = new Map(normStrata.map(s => [s.id, s.N]));
  const totalPop = [...sizes.values()].reduce((a, b) => a + b, 0);

  // Census case
  if (totalSampleSize >= totalPop) {
    const out: Record<string, number> = {};
    for (const s of normStrata) out[s.id] = s.N;
    return out;
  }

  const hasErrCol = normStrata.some(s => s.expected_error_count !== undefined);

  // p-hat per stratum
  const pHat = new Map<string, number>();
  for (const s of normStrata) {
    const p = hasErrCol
      ? Math.max(0, Math.min(1, (s.expected_error_count ?? 0) / Math.max(1, s.N)))
      : 0.5;
    pHat.set(s.id, p);
  }

  let remaining = totalSampleSize;
  const allIds = new Set(normStrata.map(s => s.id));
  const filled = new Set<string>();
  const alloc: Record<string, number> = {};

  while (true) {
    const unfilled = [...allIds].filter(id => !filled.has(id));

    // weights for unfilled
    let sumW = 0;
    const weights = new Map<string, number>();
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
    const filledTotal = [...filled].reduce((a, id) => a + (alloc[id] ?? 0), 0);
    remaining = totalSampleSize - filledTotal;
    if (remaining <= 0) break;
  }

  return alloc;
}

export type ClericalRow = {
  stratum_id: number | string;
  stratum_size: number;     // N_h
  sample_size: number;      // n_h
  sample_error_count: number; // x_h (errors found in sample)
};

/**
 * Expansion estimator of the population error *proportion* with FPC variance.
 *  - Estimate:  sum_h ( (N_h / N) * p̂_h ), where p̂_h = x_h / n_h (0 if n_h=0)
 *  - Variance:  sum_h ( (N_h / N)^2 * [ p̂_h(1-p̂_h)/n_h * (N_h*n_h)/(N_h-1) ] ), FPC
 */
export function expandErrorEstimates(rows: ClericalRow[]) {
  if (rows.length === 0) {
    return { population_proportion_estimate: 0, population_estimate_variance: 0 };
  }

  const Ntot = rows.reduce((a, r) => a + r.stratum_size, 0);

  let est = 0;
  let varSum = 0;

  for (const r of rows) {
    const N = r.stratum_size;
    const n = r.sample_size;
    const w = N / Ntot;

    const phat = n > 0 ? r.sample_error_count / n : 0;

    // binomial variance with finite population correction (as per your Python)
    const var_h =
      n > 0 && N > 1
        ? (phat * (1 - phat)) / n * ((N * n) / (N - 1))
        : 0;

    est += w * phat;
    varSum += (w * w) * var_h;
  }

  return {
    population_proportion_estimate: est,
    population_estimate_variance: varSum,
  };
}

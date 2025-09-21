import { describe, it, expect } from "vitest";
import { expandErrorEstimates, ClericalRow } from "../src/expand";

describe("expandErrorEstimates", () => {
  it("one stratum, all errors, finite N ⇒ variance 0", () => {
    const rows: ClericalRow[] = [
      { stratum_id: 1, stratum_size: 1000, sample_size: 50, sample_error_count: 50 },
    ];
    const { population_proportion_estimate: est, population_estimate_variance: v } =
      expandErrorEstimates(rows);
    expect(est).toBeCloseTo(1.0);
    expect(v).toBeCloseTo(0.0);
  });

  it("three equal strata fully sampled with 0/2/1 errors", () => {
    const rows: ClericalRow[] = [
      { stratum_id: 1, stratum_size: 2, sample_size: 2, sample_error_count: 0 },
      { stratum_id: 2, stratum_size: 2, sample_size: 2, sample_error_count: 2 },
      { stratum_id: 3, stratum_size: 2, sample_size: 2, sample_error_count: 1 },
    ];
    const { population_proportion_estimate: est, population_estimate_variance: v } =
      expandErrorEstimates(rows);
    expect(est).toBeCloseTo(0.5, 10);
    expect(v).toBeCloseTo(0.0, 10);
  });

  it("two strata: one with variance 0, one > 0", () => {
    const rows: ClericalRow[] = [
      { stratum_id: 1, stratum_size: 4, sample_size: 2, sample_error_count: 1 }, // p=0.5 -> var>0
      { stratum_id: 2, stratum_size: 2, sample_size: 2, sample_error_count: 2 }, // p=1 -> var=0
    ];
    const { population_proportion_estimate: est, population_estimate_variance: v } =
      expandErrorEstimates(rows);
    expect(est).toBeGreaterThan(0);
    expect(v).toBeGreaterThan(0);
  });
});

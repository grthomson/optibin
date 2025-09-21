import { describe, it, expect } from "vitest";
import { neymanAllocate, StratumRow } from "../src/neyman";

describe("neymanAllocate", () => {
  it("census when total sample >= population", () => {
    const df: StratumRow[] = [
      { stratum_id: 1, stratum_size: 10, expected_error_count: 3 },
      { stratum_id: 2, stratum_size: 20, expected_error_count: 5 }
    ];
    expect(neymanAllocate(df, 1000)).toEqual({ 1: 10, 2: 20 });
  });

  it("proportional fallback when no expected_error_count present", () => {
    const df: StratumRow[] = [
      { stratum_id: 1, stratum_size: 10 },
      { stratum_id: 2, stratum_size: 10 },
      { stratum_id: 3, stratum_size: 10 }
    ];
    // Math.round with no drift fix → total may be < desired
    expect(neymanAllocate(df, 10)).toEqual({ 1: 3, 2: 3, 3: 3 });
  });

  it("allocates to non-zero-variance stratum when others have p in {0,1}", () => {
    const df: StratumRow[] = [
      { stratum_id: 1, stratum_size: 10, expected_error_count: 0 },  // p=0
      { stratum_id: 2, stratum_size: 10, expected_error_count: 0 },  // p=0
      { stratum_id: 3, stratum_size: 10, expected_error_count: 5 }   // p=0.5
    ];
    expect(neymanAllocate(df, 10)).toEqual({ 1: 0, 2: 0, 3: 10 });
  });

  it("varying sizes with equal p gives proportional allocation", () => {
    const df: StratumRow[] = [
      { stratum_id: 1, stratum_size: 10, expected_error_count: 5 },  // p=0.5
      { stratum_id: 2, stratum_size: 20, expected_error_count: 10 }, // p=0.5
      { stratum_id: 3, stratum_size: 10, expected_error_count: 5 }   // p=0.5
    ];
    expect(neymanAllocate(df, 20)).toEqual({ 1: 5, 2: 10, 3: 5 });
  });
});

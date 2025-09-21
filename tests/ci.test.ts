import { describe, it, expect } from "vitest";
import { waldCI } from "../src/ci";

describe("waldCI (95%, with FPC)", () => {
  it("p=0.01, n=430, N=100000", () => {
    const { moeAbs, lower, upper } = waldCI(0.01, 430, 100000, 0.95, true);
    expect(moeAbs).toBeCloseTo(0.0094, 3);
    expect(lower).toBeCloseTo(0.0006, 3);
    expect(upper).toBeCloseTo(0.0194, 3);
  });

  it("p=0.06, n=430, N=100000", () => {
    const { moeAbs, lower, upper } = waldCI(0.06, 430, 100000, 0.95, true);
    expect(moeAbs).toBeCloseTo(0.0224, 3);
    expect(lower).toBeCloseTo(0.0376, 3);
    expect(upper).toBeCloseTo(0.0824, 3);
  });

  it("p=0.5, n=430, N=100000", () => {
    const { moeAbs, lower, upper } = waldCI(0.5, 430, 100000, 0.95, true);
    expect(moeAbs).toBeCloseTo(0.0472, 3);
    expect(lower).toBeCloseTo(0.4528, 3);
    expect(upper).toBeCloseTo(0.5472, 3);
  });

  it("without FPC matches classic Wald", () => {
    const { moeAbs } = waldCI(0.2, 100, undefined, 0.95, false);
    const expected = 1.959963984540054 * Math.sqrt((0.2 * 0.8) / 100);
    expect(moeAbs).toBeCloseTo(expected, 12);
  });
});

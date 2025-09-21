import { waldCI } from "../src/ci.js";   // 👈 note the .js
import { renderCIsToPNG } from "../src/render_png.js";

async function main() {
  const strata = [
    { stratum: "S1", p: 0.01, n: 430, N: 100000 },
    { stratum: "S2", p: 0.06, n: 430, N: 100000 },
    { stratum: "S3", p: 0.50, n: 430, N: 100000 }
  ];

  const withCIs = strata.map(s => {
    const { lower, upper } = waldCI(s.p, s.n, s.N, 0.95, true);
    return { stratum: s.stratum, p: s.p, lower, upper };
  });

  await renderCIsToPNG(withCIs, "images/cis_example.png", "Example 95% Wald CIs with FPC");
  console.log("Saved images/cis_example.png");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

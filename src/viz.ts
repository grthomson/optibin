import Plotly from "plotly.js-dist-min";

export type StratumCI = {
  stratum: string | number;
  p: number;       // estimated proportion
  lower: number;   // CI lower bound
  upper: number;   // CI upper bound
};

/**
 * Render per-stratum confidence intervals as error bars.
 * - Displays point at p, vertical error bar from lower→upper.
 * - Interactive browser plot (opens in an HTML container with id="plot").
 */
export async function plotCIs(strata: StratumCI[]) {
  const trace = {
    x: strata.map(s => String(s.stratum)),
    y: strata.map(s => s.p),
    error_y: {
      type: "data",
      symmetric: false,
      array: strata.map(s => s.upper - s.p),     // distance up
      arrayminus: strata.map(s => s.p - s.lower), // distance down
      visible: true,
    },
    mode: "markers",
    type: "scatter",
    marker: { size: 8, color: "blue" },
  };

  const layout = {
    title: "Stratum confidence intervals",
    yaxis: { range: [0, 1], title: "Proportion" },
    xaxis: { title: "Stratum" },
  };

  // Assumes you have a <div id="plot"></div> in your HTML page
  await Plotly.newPlot("plot", [trace], layout);
}

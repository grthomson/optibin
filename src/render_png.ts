import * as fs from "node:fs";
import * as path from "node:path";
import puppeteer from "puppeteer";

export type StratumCI = { stratum: string | number; p: number; lower: number; upper: number };

export async function renderCIsToPNG(strata: StratumCI[], outPath: string, title = "Stratum CIs") {
  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"><style>html,body,#plot{width:900px;height:600px;margin:0;padding:0;}</style></head>
  <body>
    <div id="plot"></div>
    <script src="https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.3/plotly.min.js"></script>
    <script>
      const strata = ${JSON.stringify(strata)};
      const trace = {
        x: strata.map(s => String(s.stratum)),
        y: strata.map(s => s.p),
        error_y: {
          type: "data",
          symmetric: false,
          array: strata.map(s => s.upper - s.p),
          arrayminus: strata.map(s => s.p - s.lower),
          visible: true
        },
        mode: "markers",
        type: "scatter"
      };
      const layout = { title: ${JSON.stringify(title)}, yaxis: {range:[0,1], title:"Proportion"}, xaxis:{title:"Stratum"} };
      window.PLOT_READY = Plotly.newPlot("plot", [trace], layout).then(() => true);
    </script>
  </body>
</html>`;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.waitForSelector("#plot .main-svg", { timeout: 10000 });

  // screenshot just the plot div for a clean image
  const plot = await page.$("#plot");
  if (!plot) throw new Error("Plot div not found");
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await plot.screenshot({ path: outPath as `${string}.png`, type: "png" });

  await browser.close();
}

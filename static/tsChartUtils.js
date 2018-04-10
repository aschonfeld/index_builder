import _ from "lodash";
import moment from "moment";

import chartUtils from "./chartUtils";

const UNIT_FMTS = { day: "MMM D YYYY", month: "MMM YYYY", year: "YYYY" };

function buildTsChart(ctxId, chartData, labels, title, colors = [chartUtils.TS_COLORS[0]], unit = null) {
  const ctx = document.getElementById(`${ctxId}Chart`);
  let chartObj = null;
  if (ctx) {
    chartUtils.fitToContainer(ctx);
    const ids = _.keys(chartData);
    chartUtils.buildLegend(`${ctxId}Legend`, ids, labels, colors);
    const datasets = _.map(_.keys(chartData), (key, i) => ({
      label: _.get(labels, key, key),
      fill: false,
      lineTension: 0.1,
      backgroundColor: colors[i],
      borderColor: colors[i],
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHitRadius: 5,
      data: _.map(chartData[key], row => ({ x: new Date(row.date), y: row.val })),
    }));
    chartObj = chartUtils.createChart(ctx, {
      type: "line",
      data: { datasets },
      options: {
        maintainAspectRatio: false,
        responsive: false,
        scales: {
          xAxes: [
            {
              type: "time",
              time: {
                unit,
                min: _.get(datasets, "0.data.0.x"),
                max: _.get(datasets, [0, "data", _.get(datasets, "0.data", []).length - 1, "x"]),
              },
            },
          ],
        },
        tooltips: {
          mode: "index",
          callbacks: {
            title: (tooltipItems, _) => moment(tooltipItems[0].xLabel).format(UNIT_FMTS[unit || "day"]),
            label: chartUtils.labelCallback(""),
          },
        },
        hover: { mode: "index", intersect: true },
        legend: { display: _.size(chartData) > 1, position: "top", labels: { usePointStyle: false } },
        title: { display: title !== "", text: title },
      },
    });
  }
  return chartObj;
}

export default { buildTsChart };

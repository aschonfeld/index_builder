import Chart from "chart.js";
import $ from "jquery";
import _ from "lodash";

import formatters from "./valueFormatters";

// needed to add these parameters because Chart.Zoom.js causes Chart.js to look for them
const DEFAULT_OPTIONS = { pan: { enabled: false }, zoom: { enabled: false } };

function createChart(ctx, cfg) {
  const options = _.assign({}, DEFAULT_OPTIONS, cfg.options || {});
  const finalCfg = _.assign({}, cfg, { options });
  return new Chart(ctx, finalCfg);
}

// http://stackoverflow.com/a/10215724/509706
function fitToContainer(canvas) {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function buildLegend(legendId, keys, labels, colors) {
  const legend = _.join(
    _.map(keys, (k, i) => {
      const colorDiv = '<div class="pieColor" style="background-color:' + colors[i] + '"></div>';
      const label = `${k}: ${_.get(labels, k, "N/A")}`;
      return "<tr><td>" + colorDiv + label + "</td></tr>";
    }),
    ""
  );
  $("#" + legendId).html('<table class="pieLegend">' + legend + "</table>");
}

function labelCallback(suffix = "%") {
  return (tooltipItem, data) =>
    `${data.datasets[tooltipItem.datasetIndex].label || ""}: ${formatters.formatFloat(tooltipItem.yLabel)}${suffix}`;
}

function axisLabelChunker(label, maxWidth = 20) {
  const lines = [];
  let currLine = [];
  _.forEach(_.split(label, " "), word => {
    currLine.push(word);
    const currSize = _.sum(_.map(currLine, _.size));
    const spaces = _.size(currLine) ? _.size(currLine) - 1 : 0;
    if (currSize + spaces > maxWidth) {
      lines.push(_.join(currLine, " "));
      currLine = [];
    }
  });
  if (_.size(_.join(currLine, " "))) {
    lines.push(_.join(currLine, " "));
  }
  return lines;
}

const TS_COLORS = [
  "rgb(42, 145, 209)",
  "rgb(255, 99, 132)",
  "rgb(255, 159, 64)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(54, 162, 235)",
  "rgb(153, 102, 255)",
  "rgb(0, 255, 128)",
];

export default {
  createChart,
  fitToContainer,
  buildLegend,
  labelCallback,
  axisLabelChunker,
  TS_COLORS,
};

import _ from "lodash";

import chartUtils from "../chartUtils";
import { REASON_LABELS, STRENGTH_LABELS } from "../constants";
import formatters from "../valueFormatters";

function factorLabelCallback(summaryData) {
  return (tooltipItems, data) =>
    _.flatMap(tooltipItems, t => {
      const label = data.datasets[t.datasetIndex].label || "";
      const factorId = data.ids[t.index];
      const strengthCode = _.findKey(STRENGTH_LABELS, v => v === label);
      const userSelections = _.get(summaryData, [factorId, "selections", strengthCode], []);
      if (_.size(userSelections)) {
        return _.concat(["", `${label} Selections:`], _.map(userSelections, s => `    ${s.user}: ${s.weight}%`));
      }
      return [];
    });
}

function reasonLabelCallback(strength, selections) {
  return tooltipItems =>
    _.flatMap(tooltipItems, t => {
      const reasonCode = _.find(REASON_LABELS[strength], { label: _.join(t.yLabel || "", " ") });
      const userSelections = _.map(_.filter(selections, s => _.includes(s.reasons, reasonCode.key)), "user");
      userSelections[0] = `Selected By: ${userSelections[0]}`;
      return _.concat([""], userSelections);
    });
}

function buildChart(ctxId, data, xTitle, additionalOptions = {}) {
  const ctx = document.getElementById(ctxId);
  if (ctx) {
    chartUtils.fitToContainer(ctx);
    return chartUtils.createChart(ctx, {
      type: "horizontalBar",
      data,
      options: _.assignIn(
        {
          scales: {
            xAxes: [
              {
                scaleLabel: { display: true, labelString: xTitle },
                ticks: {
                  min: 0,
                  max: 100,
                  stepSize: 10,
                  callback: function(value, _index, _values) {
                    return `${value} %`;
                  },
                },
              },
            ],
            yAxes: [{ ticks: { autoSkip: false } }],
          },
        },
        additionalOptions
      ),
    });
  }
  return null;
}

function buildReasonAvgChart(summaryData, onClick) {
  const sortedKeys = _.sortBy(_.keys(summaryData), k => _.parseInt(_.last(_.split(k, "_"))));
  const data = {
    ids: sortedKeys,
    labels: _.map(sortedKeys, factor => chartUtils.axisLabelChunker(summaryData[factor].label)),
    datasets: _.map(REASON_LABELS.HI, (reasonCfg, i) => ({
      label: reasonCfg.label,
      data: _.map(sortedKeys, factor => _.get(summaryData, [factor, "reason_avg", "HI", reasonCfg.key], 0)),
      backgroundColor: chartUtils.TS_COLORS[i],
      borderColor: chartUtils.TS_COLORS[i],
      borderWidth: 1,
    })),
  };
  const additionalOptions = {
    title: { display: false },
    tooltips: {
      callbacks: {
        label: function(tooltipItem, data) {
          const label = data.datasets[tooltipItem.datasetIndex].label || "";
          return `${label}: ${formatters.formatFloat(tooltipItem.xLabel)}%`;
        },
        afterBody: factorLabelCallback(summaryData),
      },
    },
    scales: {
      xAxes: [
        {
          stacked: true,
          scaleLabel: { display: true, labelString: "Reason Percentages" },
          ticks: {
            min: 0,
            stepSize: 10,
            callback: function(value, _index, _values) {
              return `${value} %`;
            },
          },
        },
      ],
      yAxes: [{ ticks: { autoSkip: false }, stacked: true }],
    },
    legend: { display: true, position: "top" },
    onClick,
  };
  return buildChart("factorChart", data, "Reason Percentages", additionalOptions);
}

function buildFactorChart(summaryData, summaryVal = "avg", onClick) {
  if (summaryVal === "reason_avg") {
    return buildReasonAvgChart(summaryData, onClick);
  }
  const sortedKeys = _.sortBy(_.keys(summaryData), k => _.parseInt(_.last(_.split(k, "_"))));
  const data = {
    ids: sortedKeys,
    labels: _.map(sortedKeys, k => chartUtils.axisLabelChunker(summaryData[k].label)),
    datasets: _.map(_.keys(STRENGTH_LABELS), (key, i) => {
      const datasetColor = _.times(_.size(summaryData), _.constant(chartUtils.TS_COLORS[i]));
      return {
        label: STRENGTH_LABELS[key],
        data: _.map(sortedKeys, factor => _.get(summaryData, [factor, summaryVal, key])),
        backgroundColor: datasetColor,
        borderColor: datasetColor,
        borderWidth: 1,
      };
    }),
  };
  const additionalOptions = {
    title: { display: false },
    tooltips: {
      callbacks: {
        label: function(tooltipItem, data) {
          const label = data.datasets[tooltipItem.datasetIndex].label || "";
          return `${label}: ${formatters.formatFloat(tooltipItem.xLabel)}%`;
        },
        afterBody: factorLabelCallback(summaryData),
      },
    },
    legend: { display: true, position: "top" },
    onClick,
  };
  return buildChart("factorChart", data, "Average Weight of Users", additionalOptions);
}

function buildReasonChart(reasonData, factor, strength, selections) {
  const datasetColor = _.times(_.size(reasonData), _.constant(chartUtils.TS_COLORS[strength == "HI" ? 0 : 1]));
  const data = {
    labels: _.map(_.keys(reasonData), key =>
      chartUtils.axisLabelChunker(_.get(_.find(REASON_LABELS[strength], { key }), "label"))
    ),
    datasets: [
      {
        label: "",
        data: _.values(reasonData),
        backgroundColor: datasetColor,
        borderColor: datasetColor,
      },
    ],
  };
  const additionalOptions = {
    title: { display: true, text: `${STRENGTH_LABELS[strength]} ${factor} Reasons` },
    tooltips: {
      callbacks: {
        label: tooltipItem => `${formatters.formatFloat(tooltipItem.xLabel)}%`,
        afterBody: reasonLabelCallback(strength, selections),
      },
    },
    legend: { display: false },
  };
  return buildChart("reasonChart", data, "% of Teams Selected", additionalOptions);
}

export default { buildFactorChart, buildReasonChart };

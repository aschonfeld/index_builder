import _ from "lodash";

function formatInt(value) {
  const intVal = _.parseInt(value);
  if (_.isNil(intVal) || _.isNaN(intVal)) {
    return value || "-";
  }
  return intVal.toLocaleString("en-US");
}

function formatFloat(value, decimalPoints = 2) {
  const floatVal = parseFloat(value);
  if (_.isNil(floatVal) || _.isNaN(floatVal)) {
    return value || "-";
  }
  return _.round(floatVal, decimalPoints) + "";
}

function formatByFactor(value, factor, output = v => formatInt(_.round(v))) {
  const floatVal = parseFloat(value);
  if (_.isNil(floatVal) || _.isNaN(floatVal)) {
    return value || "-";
  }
  return output(floatVal / factor);
}

function formatByPercent(value, output = formatFloat) {
  if (value === "N/A") {
    return value;
  }
  return formatByFactor(value, 0.01, output);
}

function formatPercent(formatter = formatByPercent) {
  return value => `${formatter(value)}%`;
}

export default {
  formatInt,
  formatFloat,
  formatByFactor,
  formatByPercent,
  formatPercent,
};

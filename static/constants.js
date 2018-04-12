import _ from "lodash";

import formatters from "./valueFormatters";
import chartUtils from "./chartUtils";

const STRENGTH_LABELS = { HI: "Pro", LO: "Anti" };

const REASON_LABELS = {
  HI: [
    { key: "futureRet", label: "Higher future returns" },
    { key: "riskReduce", label: "Risk reduction" },
    { key: "ethics", label: "Ethical responsibility" },
    { key: "affectChange", label: "Invest to affect change" },
    { key: "material", label: "Expect factor to be material in the future" },
    { key: "demand", label: "Stakeholder demand" },
  ],
  LO: [
    { key: "hurtProfits", label: "Factor will hurt profitability/stock price" },
    { key: "irrelevant", label: "Factor is irrelevant" },
  ],
};

const RET_LABELS = { cumulative: "Cumulative", excess: "Excess", annualized: "Annualized" };

const FACTOR_RET_LABELS = {
  totret_mtd_usd_mean_cumulative: "Total",
  totret_mtd_usd_sect_adj_mean_cumulative: "Sector-Relative",
};

const STATS_LABELS = [
  ["compounded return", "Compounded Return", formatters.formatPercent()],
  ["annualized", "Annualized", formatters.formatPercent()],
  ["excess over index (annualized)", "Excess Over Index (annualized)", formatters.formatPercent()],
  ["volatility", "Volatility", formatters.formatPercent()],
  ["tracking error", "Tracking Error", formatters.formatPercent()],
  ["ir", "IR", formatters.formatFloat],
];

const SAMPLE_INDEXES = _.concat(
  _.map(_.range(1,6), i => `sample_index_${i}`),
  [ "index" ],
);

const SAMPLE_COLORS = _.reduce(
  SAMPLE_INDEXES,
  (res, k, i) => _.assignIn(res, { [k]: chartUtils.TS_COLORS[i + 1] }),
  {}
);

const reasonsFormatter = row =>
  _.join(_.map(_.filter(REASON_LABELS[row.strength], ({ key }) => _.includes(row.reasons, key)), "label"), ", ");

const SELECTIONS_COLS = [
  { col: "strength", label: "Direction", sortable: true, fmt: row => STRENGTH_LABELS[_.get(row, "strength")] },
  { col: "weight", label: "Weight", sortable: true, fmt: row => _.get(row, "weight") },
  { col: "reasons", label: "Reasons", sortable: false, fmt: reasonsFormatter },
];

const USER_SELECTIONS_COLS = _.concat(
  [{ col: "user", label: "Team", sortable: true, fmt: row => _.get(row, "user") }],
  SELECTIONS_COLS
);

export {
  STRENGTH_LABELS,
  REASON_LABELS,
  FACTOR_RET_LABELS,
  RET_LABELS,
  STATS_LABELS,
  SAMPLE_INDEXES,
  SAMPLE_COLORS,
  SELECTIONS_COLS,
  USER_SELECTIONS_COLS,
};

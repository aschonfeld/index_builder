import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ReportTitleRow from "../ReportTitleRow";
import formatters from "../valueFormatters";

const COLS = [
  ["Mean", formatters.formatPercent(formatters.formatFloat)],
  ["STD", formatters.formatFloat],
  ["IR", formatters.formatFloat],
];
const TYPES = [["total", "Total"], ["sa", "Sector Adj"]];

class ReturnSummary extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (_.isEmpty(this.props.data)) {
      return null;
    }
    return (
      <div className="data-table hide-header-magic">
        <table className="table table-bordered">
          <ReportTitleRow title="Monthly Return Distribution" />
          <thead className="thead-default">
            <tr className="text-center">
              <th />
              {_.map(TYPES, ([key, label]) => (
                <th key={key} colSpan={3}>
                  {label}
                </th>
              ))}
            </tr>
            <tr>
              <th />
              {_.map(COLS, ([c, _fmt]) => <th key={c}>{c}</th>)}
              {_.map(COLS, ([c, _fmt]) => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {_.map(this.props.data, (row, i) => (
              <tr key={`row-${i}`}>
                <td>{row.name}</td>
                {_.flatMap(TYPES, ([typeKey, _label]) =>
                  _.map(COLS, ([c, fmt]) => (
                    <td key={`cell-${i}-${typeKey}_${c}`}>{fmt(_.get(row, `${typeKey}_${c}`, "-"))}</td>
                  ))
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
ReturnSummary.displayName = "ReturnSummary";
ReturnSummary.propTypes = {
  data: PropTypes.array,
};

export { ReturnSummary };

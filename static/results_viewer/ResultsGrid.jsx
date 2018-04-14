import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ReportTitleRow from "../ReportTitleRow";
import { STATS_LABELS } from "../constants";
import gridUtils from "../gridUtils";
import formatters from "../valueFormatters";

function buildBests(records) {
  return _.reduce(
    _.concat(STATS_LABELS, [["rating"]]),
    (res, [col]) => {
      let bestFunc = _.maxBy;
      if (_.includes(["volatility", "tracking error"], col)) {
        bestFunc = _.minBy;
      }
      return _.assignIn(res, { [col]: bestFunc(records, col)[col] });
    },
    {}
  );
}

function showBest(prop, record, bests) {
  if (record[prop] === bests[prop]) {
    return <i className="ico-star" />;
  }
  return null;
}

const COLUMNS_AND_LABELS = _.concat([["name", "User"]], STATS_LABELS, [
  ["rating", "Rating"],
]);

class ResultsGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sortColumn: "compounded return", sortDirection: "desc" };
    this.buildAction = this.buildAction.bind(this);
    this.sortData = this.sortData.bind(this);
    this.handleGridSort = this.handleGridSort.bind(this);
  }

  sortData(data) {
    const { sortColumn, sortDirection } = this.state;
    if (sortColumn) {
      const sorter = r => {
        const val = _.get(r, sortColumn);
        if (val === "N/A") {
          return sortDirection === "ASC" ? 9999999 : -9999999;
        }
        return val;
      };
      return _.orderBy(data, [sorter], [_.lowerCase(sortDirection || "asc")]);
    }
    return data;
  }

  handleGridSort(newSortColumn, newSortDirection) {
    const { sortColumn, sortDirection } = this.state;
    const updatedSort = gridUtils.sortHandler(sortColumn, sortDirection, newSortColumn, newSortDirection);
    this.setState(updatedSort);
  }

  buildAction(name, stats) {
    if (_.get(stats, "unlockable")) {
      const url = `/index-builder/unlock-factor-settings?user=${name}`;
      return <i className="ico-lock-open" onClick={() => $.get(url, () => location.reload())} />;
    }
    if (_.get(stats, "sample")) {
      const className = `ico-check-box${_.includes(this.props.selectedSamples, name) ? "" : "-outline-blank"}`;
      return <i className={className} onClick={() => this.props.toggleSampleIndex(name)} />;
    }
    return null;
  }

  render() {
    const { results, selectedUser, toggleUser } = this.props;
    const { sortColumn, sortDirection } = this.state;

    const headers = _.map(COLUMNS_AND_LABELS, ([c, label]) => {
      let newSortDir = "ASC";
      let sortIcon = null;
      if (c === sortColumn) {
        newSortDir = sortDirection === "ASC" ? "DESC" : "ASC";
        sortIcon = <i className={`ico-arrow-drop-${sortDirection === "ASC" ? "down" : "up"}`} />;
      }
      return (
        <th key={`col-${c}`} colSpan={c === "name" ? 2 : 1}>
          <div className="form-group">
            <label className="mb-1 pointer" onClick={() => this.handleGridSort(c, newSortDir)}>
              {label} {sortIcon}
            </label>
          </div>
        </th>
      );
    });

    let records = _.map(_.omit(results, "samples"), (userResults, user) => {
      const rowClass = `${selectedUser === user ? "selected-row" : "unselected-row"}`;
      const { stats } = userResults;
      const data = _.assignIn({}, stats, { name: user, rowClass, onClick: () => toggleUser(user) });
      return data;
    });
    const bests = buildBests(records);
    records = _.concat(
      records,
      _.map(results.samples.stats, (sampleStats, sampleIndex) => {
        const data = _.assignIn(
          { name: sampleIndex, onClick: _.noop, sample: true, rowClass: "sample-index" },
          sampleStats
        );
        if (sampleIndex === "index") {
          data["tracking error"] = "N/A";
          data.ir = "N/A";
        }
        data.rating = "N/A";
        return data;
      })
    );

    return (
      <div className="data-table results-grid">
        <table className="table table-bordered table-hover">
          <ReportTitleRow title="Team Performance" />
          <colgroup>
            <col />
            {_.map(COLUMNS_AND_LABELS, (_c, i) => <col key={`col${i}`} className={`col${i}`} />)}
          </colgroup>
          <thead className="thead-default">
            <tr>{headers}</tr>
          </thead>
          <tbody>
            {_.map(this.sortData(records), (record, i) => (
              <tr key={`row-${i}`} className={record.rowClass}>
                <td>{this.buildAction(record.name, record)}</td>
                <td className={`col${i}`} onClick={record.onClick}>
                  {record.name}
                </td>
                {_.map(STATS_LABELS, ([col, _label, fmt]) => (
                  <td key={`stat-${i}-${col}`} onClick={record.onClick}>
                    {fmt(_.get(record, col, 0))}
                    {showBest(col, record, bests)}
                  </td>
                ))}
                <td onClick={record.onClick}>
                  {formatters.formatFloat(_.get(record, "rating", 0))}
                  {showBest("rating", record, bests)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
ResultsGrid.displayName = "ResultsGrid";
ResultsGrid.propTypes = {
  results: PropTypes.object,
  selectedUser: PropTypes.string,
  selectedSamples: PropTypes.array,
  toggleSampleIndex: PropTypes.func,
  toggleUser: PropTypes.func,
};

export { ResultsGrid };

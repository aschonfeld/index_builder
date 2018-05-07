import $ from "jquery";
import _ from "lodash";
import moment from "moment";
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

const COLUMNS_AND_LABELS = _.concat([["name", "User"]], STATS_LABELS, [["rating", "Rating"]]);

class ResultsGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sortColumn: "compounded return", sortDirection: "desc", lastCached: moment(), showUnlocked: false };
    this.buildAction = this.buildAction.bind(this);
    this.sortData = this.sortData.bind(this);
    this.handleGridSort = this.handleGridSort.bind(this);
    this.refresh = this.refresh.bind(this);
    this.renderTitleWithArchives = this.renderTitleWithArchives.bind(this);
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
      const onClick = () => {
        $.get(`/esg/unlock-factor-settings?user=${name}`, data => {
          if (data.success && data.locked > 0) {
            location.reload();
          }
          location.href = "/esg/factors";
        });
      };
      return <i className="ico-lock-open" onClick={onClick} />;
    }
    if (_.get(stats, "sample")) {
      const className = `ico-check-box${_.includes(this.props.selectedSamples, name) ? "" : "-outline-blank"}`;
      return <i className={className} onClick={() => this.props.toggleSampleIndex(name)} />;
    }
    return null;
  }

  refresh() {
    this.setState({ lastCached: moment() });
    this.props.refresh();
  }

  renderTitleWithArchives() {
    const title = "Team Performance";
    const archives = _.get(this.props, "results.archives", []);
    let archivesMarkup = null;
    if (_.size(archives)) {
      archivesMarkup = (
        <div className="input-group archives">
          <span className="input-group-addon">Snapshot</span>
          <select
            value={this.props.selectedArchive || ""}
            className="form-control custom-select"
            onChange={event => this.props.toggleArchive(event.target.value)}>
            <option value={""}>Active Users</option>
            {_.map(archives, a => (
              <option key={a} value={a}>
                {moment(a, "YYYYMMDDHHmmss").format("M/D/YYYY h:mm:ss")}
              </option>
            ))}
          </select>
        </div>
      );
    }
    const unlocked = _.get(this.props, "results.unlocked", []);
    let unlockedMarkup = null;
    if (_.size(unlocked)) {
      const { showUnlocked } = this.state;
      unlockedMarkup = (
        <div className="pl-5 unlocked-toggle">
          <span className="pr-4 float-left mt-3">In-Progress Teams</span>
          <div className="factor-types">
            <div className="btn-group">
              <button
                className={`btn ${showUnlocked ? "inactive" : "btn-primary active"}`}
                onClick={showUnlocked ? () => this.setState({ showUnlocked: false }) : _.noop}>
                Hidden
              </button>
              <button
                className={`btn ${showUnlocked ? "btn-primary active" : "inactive"}`}
                onClick={showUnlocked ? _.noop : () => this.setState({ showUnlocked: true })}>
                Visible
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="title-section">
        <span>{title}</span>
        <div className="actions d-flex">
          {archivesMarkup}
          {unlockedMarkup}
        </div>
      </div>
    );
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

    let records = _.map(_.get(results, "users", {}), (userResults, user) => {
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

    if (this.state.showUnlocked) {
      const baseRow = _.mapValues(records[0], () => "N/A");
      records = _.concat(
        records,
        _.map(results.unlocked, team =>
          _.assignIn({}, baseRow, { name: team, onClick: _.noop, unlocked: true, rowClass: "unlocked-row" })
        )
      );
    }

    const lastCached = this.state.lastCached.format("M/D/YYYY h:mm:ss a");
    return (
      <div className="data-table results-grid">
        <table className="table table-bordered table-hover">
          <ReportTitleRow title={this.renderTitleWithArchives()} refresh={this.refresh} lastCached={lastCached} />
          <colgroup>
            <col />
            {_.map(COLUMNS_AND_LABELS, (_c, i) => <col key={`col${i}`} className={`col${i}`} />)}
          </colgroup>
          <thead className="thead-default">
            <tr>{headers}</tr>
          </thead>
          <tbody>
            {_.map(this.sortData(records), (record, i) => {
              if (record.unlocked) {
                return (
                  <tr key={`row-${i}`} className={record.rowClass}>
                    <td />
                    <td>{record.name}</td>
                    <td colSpan={_.size(COLUMNS_AND_LABELS)} className="text-center">
                      Currently In-Progress
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={`row-${i}`} className={record.rowClass}>
                  <td>{this.buildAction(record.name, record)}</td>
                  <td onClick={record.onClick}>{record.name}</td>
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
              );
            })}
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
  selectedArchive: PropTypes.string,
  selectedSamples: PropTypes.array,
  toggleSampleIndex: PropTypes.func,
  toggleUser: PropTypes.func,
  refresh: PropTypes.func,
  toggleArchive: PropTypes.func,
};
ResultsGrid.defaultProps = { refresh: _.noop };

export { ResultsGrid };

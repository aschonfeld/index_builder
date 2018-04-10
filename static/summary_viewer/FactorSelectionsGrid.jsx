import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import ReportTitleRow from "../ReportTitleRow";
import { STRENGTH_LABELS, USER_SELECTIONS_COLS } from "../constants";
import gridUtils from "../gridUtils";

class FactorSelectionsGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sortColumn: "user", sortDirection: "desc" };
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

  render() {
    const { selectedFactor, summary } = this.props;
    if (_.isEmpty(selectedFactor)) {
      return null;
    }
    const { factor, strength } = selectedFactor || {};
    const factorLabel = _.get(summary, [factor, "label"], factor);
    const userSelections = _.get(summary, [factor, "selections", strength], []);
    const { sortColumn, sortDirection } = this.state;

    const headers = _.map(_.filter(USER_SELECTIONS_COLS, "sortable"), ({ col, label }) => {
      let newSortDir = "ASC";
      let sortIcon = null;
      if (col === sortColumn) {
        newSortDir = sortDirection === "ASC" ? "DESC" : "ASC";
        sortIcon = <i className={`ico-arrow-drop-${sortDirection === "ASC" ? "down" : "up"}`} />;
      }
      return (
        <th key={`col-${col}`}>
          <div className="form-group">
            <label className="mb-1 pointer" onClick={() => this.handleGridSort(col, newSortDir)}>
              {label} {sortIcon}
            </label>
          </div>
        </th>
      );
    });

    return (
      <div className="data-table factor-selections-grid">
        <table className="table table-bordered table-hover">
          <ReportTitleRow title={`Users Who Selected "${STRENGTH_LABELS[strength]} ${factorLabel}"`} />
          <colgroup>{_.map(USER_SELECTIONS_COLS, (_c, i) => <col key={`col${i}`} className={`col${i}`} />)}</colgroup>
          <thead className="thead-default">
            <tr>
              {headers}
              <th>
                <label className="mb-1">Reasons</label>
              </th>
            </tr>
          </thead>
          <tbody>
            {_.map(this.sortData(userSelections), (record, i) => (
              <tr key={`row-${i}`} className={record.rowClass}>
                {_.map(USER_SELECTIONS_COLS, ({ col, fmt }) => <td key={`stat-${i}-${col}`}>{fmt(record)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
FactorSelectionsGrid.displayName = "FactorSelectionsGrid";
FactorSelectionsGrid.propTypes = {
  selectedFactor: PropTypes.object,
  summary: PropTypes.object,
};

export { FactorSelectionsGrid };

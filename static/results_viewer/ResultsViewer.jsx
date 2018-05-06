import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import ReportTitleRow from "../ReportTitleRow";
import actions from "../actions/results-viewer";
import { SELECTIONS_COLS } from "../constants";
import { BarraExposures } from "./BarraExposures";
import { ResultsGrid } from "./ResultsGrid";
import { ReturnsChart } from "./ReturnsChart";
import { SectorExposures } from "./SectorExposures";

require("./ResultsViewer.css");

const BASE_STATE = {
  selectedSamples: [],
};

class ReactResultsViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = BASE_STATE;
    this.toggleUser = this.toggleUser.bind(this);
    this.toggleSampleIndex = this.toggleSampleIndex.bind(this);
    this.renderResults = this.renderResults.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      this.setState(BASE_STATE);
    }
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    if (!_.isEqual(this.state, newState)) {
      return true;
    }

    return false; // Otherwise, use the default react behaviour.
  }

  toggleUser(user) {
    if (this.props.selectedUser === user) {
      return;
    }
    this.props.selectedUserChange(user);
  }

  toggleSampleIndex(index) {
    let selectedSamples = [];
    if (_.includes(this.state.selectedSamples, index)) {
      selectedSamples = _.without(this.state.selectedSamples, index);
    } else {
      selectedSamples = _.concat(this.state.selectedSamples, [index]);
    }
    this.setState({ selectedSamples });
  }

  renderResults() {
    if (this.props.loadingUserResults) {
      return <Bouncer />;
    }
    const { selectedUser, userResults } = this.props;
    if (_.isNil(userResults) || _.isEmpty(userResults)) {
      return null;
    }
    if (userResults.error) {
      return <RemovableError message={userResults.error} traceback={userResults.traceback} />;
    }

    const { selectedSamples } = this.state;
    return [
      <ResultsGrid
        key={1}
        selectedUser={selectedUser}
        selectedArchive={this.props.selectedArchive}
        selectedSamples={selectedSamples}
        results={this.props.results}
        toggleUser={this.toggleUser}
        toggleSampleIndex={this.toggleSampleIndex}
        toggleArchive={this.props.toggleSelectedArchive}
        refresh={this.props.refreshResults}
      />,
      <div key={3} className="data-table">
        <table className="table table-bordered">
          <ReportTitleRow title={`${selectedUser} - Selected Factors`} />
          <thead className="thead-default">
            <tr>
              <th>Factor</th>
              {_.map(SELECTIONS_COLS, ({ label }, i) => <th key={i}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {_.map(_.sortBy(_.keys(userResults.settings), k => _.parseInt(_.last(_.split(k, "_")))), k => {
              const userFactor = userResults.settings[k];
              return (
                <tr key={`row-${k}`}>
                  <td>{userFactor.label}</td>
                  {_.map(SELECTIONS_COLS, ({ col, fmt }) => <td key={`stat-${k}-${col}`}>{fmt(userFactor)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>,
      <ReturnsChart key={4} selectedSamples={selectedSamples} />,
      <SectorExposures key={5} selectedSamples={selectedSamples} />,
      <BarraExposures key={6} selectedSamples={selectedSamples} />,
    ];
  }

  render() {
    if (this.props.loadingResults) {
      return <Bouncer />;
    }
    const { results } = this.props;

    if (results.error) {
      return <RemovableError message={results.error} traceback={results.traceback} />;
    }

    return <div className="ResultsViewer">{this.renderResults()}</div>;
  }
}
ReactResultsViewer.displayName = "ReactResultsViewer";
ReactResultsViewer.propTypes = {
  loadingResults: PropTypes.bool,
  results: PropTypes.object,
  selectedUser: PropTypes.string,
  selectedArchive: PropTypes.string,
  selectedUserChange: PropTypes.func,
  refreshResults: PropTypes.func,
  loadingUserResults: PropTypes.bool,
  userResults: PropTypes.object,
  toggleSelectedArchive: PropTypes.func,
};

function mapStateToProps(state) {
  return {
    loadingResults: state.loadingResults,
    results: state.results,
    sampleIndexes: state.sampleIndexes,
    selectedUser: state.selectedUser,
    selectedArchive: state.selectedArchive,
    userResults: state.userResults,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    selectedUserChange: user => dispatch(actions.toggleUserResults(user)),
    refreshResults: () => dispatch(actions.refreshResults()),
    toggleSelectedArchive: archive => dispatch(actions.toggleSelectedArchive(archive)),
  };
}

const ReduxResultsViewer = connect(mapStateToProps, mapDispatchToProps)(ReactResultsViewer);

export { ReactResultsViewer, ReduxResultsViewer as ResultsViewer };

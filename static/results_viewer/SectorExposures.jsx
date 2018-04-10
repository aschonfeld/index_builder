import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { buildSectorColors } from "../colors";
import tsChartUtils from "../tsChartUtils";

function buildSectorChart(props, selectedExposures) {
  const { userResults, gicsMappings, sampleIndexes, selectedSamples } = props;
  let { sectors } = userResults;
  if (_.includes(selectedSamples, selectedExposures)) {
    sectors = _.get(sampleIndexes, ["sectors", selectedExposures]);
  }
  const ids = _.keys(sectors);
  const colors = buildSectorColors(ids);
  return tsChartUtils.buildTsChart("sector", sectors, gicsMappings, "", colors);
}

const BASE_STATE = { selectedExposures: null, chart: null };

class ReactSectorExposures extends React.Component {
  constructor(props) {
    super(props);
    this.state = BASE_STATE;
    this.toggleExposures = this.toggleExposures.bind(this);
  }

  componentDidMount() {
    if (_.isEmpty(this.props.userResults)) {
      return;
    }
    const { selectedUser } = this.props;
    this.setState({ selectedExposures: selectedUser, chart: buildSectorChart(this.props, selectedUser) });
  }

  componentDidUpdate() {
    if (_.isEmpty(this.props.userResults)) {
      return;
    }
    if (_.isNull(this.state.chart)) {
      const { selectedUser } = this.props;
      this.setState({ selectedExposures: selectedUser, chart: buildSectorChart(this.props, selectedUser) });
      return;
    }
  }

  shouldComponentUpdate(newProps, newState) {
    return !_.isEqual(this.props, newProps) || this.state.selectedExposures !== newState.selectedExposures;
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(_.omit(this.props, "selectedSamples"), _.omit(nextProps, "selectedSamples"))) {
      if (this.state.chart) {
        this.state.chart.destroy();
      }
      this.setState(BASE_STATE);
    }
  }

  toggleExposures(selectedExposures) {
    const { chart } = this.state;
    if (chart) {
      chart.destroy();
    }

    this.setState({ selectedExposures, chart: buildSectorChart(this.props, selectedExposures) });
  }

  render() {
    if (this.props.loadingUserResults) {
      return <Bouncer />;
    }
    const { selectedUser, selectedSamples } = this.props;
    return [
      <div key={0} className="row returns-header">
        <div className="col-md-9 float-left align-middle">
          <strong>Sector Exposures</strong>
        </div>
        <div className="col-md-3">
          <div className="return-types float-right">
            <div className="btn-group">
              {_.map(_.concat([selectedUser], selectedSamples || []), c => (
                <button
                  key={c}
                  className={`btn ${this.state.selectedExposures === c ? "btn-primary active" : "inactive"}`}
                  onClick={() => this.toggleExposures(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>,
      <div key={1} className="row SectorExposures">
        <div className="col-md-2" id="sectorLegend" />
        <div className="col-md-10">
          <div className="chart-wrapper">
            <canvas id="sectorChart" height={200} />
          </div>
        </div>
      </div>,
    ];
  }
}
ReactSectorExposures.displayName = "ReactSectorExposures";
ReactSectorExposures.propTypes = {
  loadingUserResults: PropTypes.bool,
  userResults: PropTypes.object,
  selectedUser: PropTypes.string,
  selectedSamples: PropTypes.array,
};

function mapStateToProps(state) {
  return {
    selectedUser: state.selectedUser,
    gicsMappings: state.gicsMappings,
    loadingUserResults: state.loadingUserResults,
    userResults: state.userResults,
    sampleIndexes: state.sampleIndexes,
  };
}

const ReduxSectorExposures = connect(mapStateToProps)(ReactSectorExposures);

export { ReactSectorExposures, ReduxSectorExposures as SectorExposures };

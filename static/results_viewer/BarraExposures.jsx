import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { JSAnchor } from "../JSAnchor";
import chartUtils from "../chartUtils";
import { SAMPLE_COLORS } from "../constants";
import tsChartUtils from "../tsChartUtils";

function buildBarraChart(props, series) {
  const { userResults, selectedUser, selectedSamples, sampleIndexes } = props;
  const barraData = { [selectedUser]: _.get(userResults, ["barra", series]) };
  _.forEach(selectedSamples, index => {
    barraData[index] = _.get(sampleIndexes, ["barra", index, series], []);
  });
  const colors = _.concat([chartUtils.TS_COLORS[0]], _.map(selectedSamples, k => SAMPLE_COLORS[k]));
  return tsChartUtils.buildTsChart("barra", barraData, {}, "Barra Exposures", colors);
}

const BASE_STATE = { chart: null, selectedFactor: null };

class ReactBarraExposures extends React.Component {
  constructor(props) {
    super(props);
    this.state = BASE_STATE;
    this.toggleBarraFactor = this.toggleBarraFactor.bind(this);
    this.renderFactors = this.renderFactors.bind(this);
  }

  componentDidMount() {
    if (_.isEmpty(this.props.userResults)) {
      return;
    }
    const selectedFactor = _.head(_.keys(_.get(this.props, "userResults.barra", {})));
    this.setState({ selectedFactor, chart: buildBarraChart(this.props, selectedFactor) });
  }

  componentDidUpdate() {
    if (_.isEmpty(this.props.userResults)) {
      return;
    }
    if (_.isNull(this.state.chart)) {
      const selectedFactor = _.head(_.keys(_.get(this.props, "userResults.barra", {})));
      this.setState({ selectedFactor, chart: buildBarraChart(this.props, selectedFactor) });
      return;
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      if (this.state.chart) {
        this.state.chart.destroy();
      }
      this.setState(BASE_STATE);
    }
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    if (this.state.selectedFactor !== newState.selectedFactor) {
      return true;
    }

    return false; // Otherwise, use the default react behaviour.
  }

  toggleBarraFactor(factor) {
    const { chart } = this.state;
    if (chart) {
      chart.destroy();
    }
    this.setState({ selectedFactor: factor, chart: buildBarraChart(this.props, factor) });
  }

  renderFactors() {
    const { userResults } = this.props;
    const { barra } = userResults;
    const barraOptions = _.map(barra, (_data, key) => {
      const props = {
        styleClass: `list-group-item list-group-item-action ${this.state.selectedFactor === key ? "active" : ""}`,
        key: key,
        onClick: () => this.toggleBarraFactor(key),
      };
      return (
        <JSAnchor {...props}>
          <div>
            <span>{key}</span>
          </div>
        </JSAnchor>
      );
    });
    if (barraOptions.length) {
      return <ul className="list-group BarraSections">{barraOptions}</ul>;
    }
    return null;
  }

  render() {
    if (this.props.loadingUserResults) {
      return <Bouncer />;
    }

    return (
      <div className="row">
        <div className="col-md-2">{this.renderFactors()}</div>
        <div className="col-md-10">
          <div className="chart-wrapper">
            <canvas id="barraChart" height={200} />
          </div>
        </div>
      </div>
    );
  }
}
ReactBarraExposures.displayName = "ReactBarraExposures";
ReactBarraExposures.propTypes = {
  loadingUserResults: PropTypes.bool,
  userResults: PropTypes.object,
  selectedUser: PropTypes.string,
  sampleIndexes: PropTypes.object,
  selectedSamples: PropTypes.array,
};

function mapStateToProps(state) {
  return {
    selectedUser: state.selectedUser,
    loadingUserResults: state.loadingUserResults,
    userResults: state.userResults,
    sampleIndexes: state.sampleIndexes,
  };
}

const ReduxBarraExposures = connect(mapStateToProps)(ReactBarraExposures);

export { ReactBarraExposures, ReduxBarraExposures as BarraExposures };

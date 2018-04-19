import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { buildScoreColors } from "../colors";
import { FACTOR_RET_LABELS as RET_LABELS } from "../constants";
import tsChartUtils from "../tsChartUtils";

function buildTsChart(factorData, selectedReturns) {
  const data = _.get(factorData, ["returns", selectedReturns], {});
  const colors = buildScoreColors(_.keys(data));
  return tsChartUtils.buildTsChart("timeseries", data, {}, "", colors, "month");
}

const BASE_STATE = { chart: null, selectedReturns: null };

class ReactReturnsChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = BASE_STATE;
    this.toggleReturns = this.toggleReturns.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      const { chart } = this.state;
      if (chart) {
        chart.destroy();
      }
      this.setState(BASE_STATE);
    }
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }

    if (this.state.selectedReturns !== newState.selectedReturns) {
      return true;
    }

    return false; // Otherwise, use the default react behaviour.
  }

  componentDidUpdate() {
    if (_.isEmpty(this.props.factorData)) {
      return;
    }
    if (_.isNull(this.state.chart)) {
      const selectedReturns = _.head(_.keys(_.get(this.props.factorData, "returns", {})));
      this.toggleReturns(selectedReturns);
    }
  }

  componentDidMount() {
    if (_.isEmpty(this.props.factorData)) {
      return;
    }
    const selectedReturns = _.head(_.keys(_.get(this.props.factorData, "returns", {})));
    this.toggleReturns(selectedReturns);
  }

  toggleReturns(returnType) {
    const { chart } = this.state;
    if (chart) {
      chart.destroy();
    }
    this.setState({ selectedReturns: returnType, chart: buildTsChart(this.props.factorData, returnType) });
  }

  render() {
    if (this.props.loadingFactor) {
      return <Bouncer />;
    }
    const { factorData } = this.props;
    if (_.isNil(factorData) || _.isEmpty(factorData)) {
      return null;
    }

    return (
      <div className="row">
        <div className="col-md-12 returns">
          <div className="row returns-header">
            <div className="col-md-9 float-left align-middle">
              <strong>Cumulative Returns</strong>
            </div>
            <div className="col-md-3">
              <div className="return-types float-right">
                <div className="btn-group">
                  {_.map(_.keys(_.get(factorData, "returns", {})), c => (
                    <button
                      key={c}
                      className={`btn ${this.state.selectedReturns == c ? "btn-primary active" : "inactive"}`}
                      onClick={() => this.toggleReturns(c)}>
                      {RET_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="chart-wrapper">
            <canvas id="timeseriesChart" height={200} />
          </div>
        </div>
      </div>
    );
  }
}
ReactReturnsChart.displayName = "ReactReturnsChart";
ReactReturnsChart.propTypes = {
  loadingFactor: PropTypes.bool,
  factorData: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    loadingFactor: state.loadingFactor,
    factorData: state.factorData,
  };
}

const ReduxReturnsChart = connect(mapStateToProps)(ReactReturnsChart);

export { ReactReturnsChart, ReduxReturnsChart as ReturnsChart };

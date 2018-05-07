import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import { STRENGTH_LABELS } from "../constants";
import { FactorSelectionsGrid } from "./FactorSelectionsGrid";
import { SummaryViewToggle } from "./SummaryViewToggle";
import summaryChartUtils from "./summaryChartUtils";

require("./SummaryViewer.css");

const FACTOR_BREAKDOWNS = [["avg", "Weights"], ["reason_avg", "Stacked Reasons"]];

const BASE_STATE = {
  charts: { factor: null, reason: null },
  selectedFactor: null,
  selectedFactorData: "avg",
};

class ReactSummaryViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = BASE_STATE;
    this.toggleReasonChart = this.toggleReasonChart.bind(this);
    this.toggleFactorData = this.toggleFactorData.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      _.forEach(_.without(this.state.charts, null), chart => chart.destroy());
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

  componentDidUpdate() {
    if (_.isEmpty(this.props.summary)) {
      return;
    }
    if (_.isEqual(this.state.charts, BASE_STATE.charts)) {
      _.forEach(_.without(this.state.charts, null), chart => chart.destroy());
      const { summary } = this.props;
      const selectedFactor = { factor: _.findKey(summary, s => _.find(_.values(s.avg), a => a > 0)) };
      selectedFactor.strength = _.findKey(summary[selectedFactor.factor].avg, a => a > 0);
      const charts = {
        factor: summaryChartUtils.buildFactorChart(summary, this.state.selectedFactorData, this.toggleReasonChart),
        reason: summaryChartUtils.buildReasonChart(
          _.get(summary, [selectedFactor.factor, "reason_avg", selectedFactor.strength], {}),
          _.get(summary, [selectedFactor.factor, "label"], selectedFactor.factor),
          selectedFactor.strength,
          _.get(this.props.summary, [selectedFactor.factor, "selections", selectedFactor.strength], [])
        ),
      };
      this.setState({ selectedFactor, charts });
      return;
    }
  }

  toggleReasonChart(evt) {
    const { charts, selectedFactorData } = this.state;
    const { factor } = charts;
    if (factor) {
      const datasets = factor.getElementAtEvent(evt);
      if (datasets.length) {
        const selectedDataset = datasets[0];
        const selectedFactor = {
          factor: selectedDataset._chart.chart.config.data.ids[selectedDataset._index],
          strength: selectedFactorData === "reason_avg" ? "HI" : _.keys(STRENGTH_LABELS)[selectedDataset._datasetIndex],
        };
        if (_.isEqual(selectedFactor, this.state.selectedFactor)) {
          return;
        }
        const { charts } = this.state;
        if (charts.reason) {
          charts.reason.destroy();
        }
        const reason = summaryChartUtils.buildReasonChart(
          _.get(this.props.summary, [selectedFactor.factor, "reason_avg", selectedFactor.strength], {}),
          _.get(this.props.summary, [selectedFactor.factor, "label"], selectedFactor.factor),
          selectedFactor.strength,
          _.get(this.props.summary, [selectedFactor.factor, "selections", selectedFactor.strength], [])
        );
        this.setState({ selectedFactor, charts: _.assignIn(this.state.charts, { reason }) });
      }
    }
  }

  toggleFactorData(factorDataType) {
    const { charts } = this.state;
    if (charts.factor) {
      charts.factor.destroy();
    }
    const factor = summaryChartUtils.buildFactorChart(this.props.summary, factorDataType, this.toggleReasonChart);
    this.setState({ selectedFactorData: factorDataType, charts: _.assignIn(this.state.charts, { factor }) });
  }

  render() {
    if (this.props.loadingSummary) {
      return <Bouncer />;
    }
    const { summary } = this.props;

    if (summary.error) {
      return <RemovableError message={summary.error} />;
    }

    return (
      <div className="SummaryViewer">
        <SummaryViewToggle />
        <div className="row">
          <div className="col-md-8">
            <div className="row factors-header">
              <div className="col-md-12">
                <div className="float-left mt-3">
                  <strong>Factors</strong>
                </div>
                <div className="factor-types float-right">
                  <div className="btn-group">
                    {_.map(FACTOR_BREAKDOWNS, ([c, label]) => (
                      <button
                        key={c}
                        className={`btn ${this.state.selectedFactorData == c ? "btn-primary active" : "inactive"}`}
                        onClick={() => this.toggleFactorData(c)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="chart-wrapper">
              <canvas id="factorChart" height={200} />
            </div>
          </div>
          <div className="col-md-4">
            <div className="row reasons-header" />
            <div className="chart-wrapper">
              <canvas id="reasonChart" height={200} />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <FactorSelectionsGrid summary={summary} selectedFactor={this.state.selectedFactor} />
          </div>
        </div>
      </div>
    );
  }
}
ReactSummaryViewer.displayName = "ReactSummaryViewer";
ReactSummaryViewer.propTypes = {
  loadingSummary: PropTypes.bool,
  summary: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    loadingSummary: state.loadingSummary,
    summary: state.summary,
  };
}

const ReduxSummaryViewer = connect(mapStateToProps)(ReactSummaryViewer);

export { ReactSummaryViewer, ReduxSummaryViewer as SummaryViewer };

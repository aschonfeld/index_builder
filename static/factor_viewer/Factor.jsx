import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import ReportTitleRow from "../ReportTitleRow";
import chartUtils from "../chartUtils";
import { buildScoreColors, buildSectorColors } from "../colors";
import formatters from "../valueFormatters";
import { FactorInputs } from "./FactorInputs";
import { ReturnSummary } from "./ReturnSummary";
import { ReturnsChart } from "./ReturnsChart";

function destroyCharts(charts) {
  _.forEach(_.without(_.map(charts), null), chart => chart.destroy());
}

function buildScoreChart(factorData) {
  const ctx = document.getElementById("scoreChart");
  let chartObj = null;
  if (ctx) {
    chartUtils.fitToContainer(ctx);
    const { scores } = factorData;
    const scoreDefs = factorData.score_defs;
    const scoreIds = _.map(_.without(_.keys(scores), "# Cols", "Total"), _.parseInt);
    const scoreTotal = _.get(scores, "Total", 1);
    const scoreColors = buildScoreColors(scoreIds);
    chartUtils.buildLegend("scoreLegend", scoreIds, scoreDefs, scoreColors);
    const chartData = {
      labels: scoreIds,
      datasets: [
        {
          label: "",
          data: _.map(scoreIds, v => _.get(scores, v) / scoreTotal * 100),
          backgroundColor: scoreColors,
          borderColor: scoreColors,
        },
      ],
    };
    chartObj = chartUtils.createChart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        scales: {
          yAxes: [
            {
              scaleLabel: { display: true, labelString: "% of Universe" },
              ticks: {
                min: 0,
                max: 100,
                stepSize: 10,
                callback: function(value, _index, _values) {
                  return `${formatters.formatFloat(value)}%`;
                },
              },
            },
          ],
          xAxes: [{ ticks: { autoSkip: false } }],
        },
        tooltips: { callbacks: { label: chartUtils.labelCallback() } },
        legend: { display: false },
        title: { display: true, text: "Score Distribution" },
      },
    });
  }
  return chartObj;
}

function buildSectorChart(factorData, gicsMappings) {
  const ctx = document.getElementById("sectorChart");
  let chartObj = null;
  if (ctx) {
    chartUtils.fitToContainer(ctx);
    const { sectors } = factorData;
    const sectorIds = _.map(_.without(_.keys(sectors), "Total"), _.parseInt);
    const sectorTotal = _.get(sectors, "Total", 1);
    const sectorColors = buildSectorColors(sectorIds);
    const chartData = {
      labels: sectorIds,
      datasets: [
        {
          label: "",
          data: _.map(sectorIds, s => formatters.formatFloat(_.get(sectors, s) / sectorTotal * 100)),
          backgroundColor: sectorColors,
          borderColor: sectorColors,
        },
      ],
    };
    chartUtils.buildLegend("sectorLegend", sectorIds, gicsMappings, sectorColors);
    chartObj = chartUtils.createChart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        scales: {
          yAxes: [
            {
              scaleLabel: { display: true, labelString: "% of Universe" },
              ticks: {
                min: 0,
                max: 100,
                stepSize: 10,
                callback: function(value, _index, _values) {
                  return `${value}%`;
                },
              },
            },
          ],
          xAxes: [{ ticks: { autoSkip: false } }],
        },
        tooltips: { callbacks: { label: chartUtils.labelCallback() } },
        legend: { display: false },
        title: { display: true, text: "Sector Distribution" },
      },
    });
  }
  return chartObj;
}

const BASE_STATE = {
  charts: { scoreChart: null, sectorChart: null },
  error: null,
};

class ReactFactor extends React.Component {
  constructor(props) {
    super(props);
    this.state = BASE_STATE;
    this.renderTopBottom = this.renderTopBottom.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      destroyCharts(this.state.charts);
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
    if (this.props.loadingFactor || _.isEmpty(this.props.factorData)) {
      return;
    }
    if (_.isEqual(this.state.charts, BASE_STATE.charts)) {
      const { factorData, gicsMappings } = this.props;
      this.setState({
        charts: {
          scoreChart: buildScoreChart(factorData),
          sectorChart: buildSectorChart(factorData, gicsMappings),
        },
      });
    }
  }

  renderTopBottom(key, title) {
    const data = _.get(this.props.factorData, key, {});
    if (_.isEmpty(data)) {
      return null;
    }
    return (
      <div className="data-table hide-header-magic">
        <table className="table table-bordered">
          <ReportTitleRow title={title} />
          <tbody>
            {_.map(_.range(5), i => (
              <tr key={`row-${i}`}>
                <td>{data[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    if (this.props.loadingFactor) {
      return <Bouncer />;
    }
    if (_.isNil(this.props.factorData)) {
      return null;
    }
    const { selectedFactor, factorData } = this.props;
    const { label, description } = factorData;

    let errorMarkup = null;
    if (this.state.error) {
      errorMarkup = (
        <div className="row">
          <RemovableError message={this.state.error} onRemove={() => this.setState({ error: null })} />
        </div>
      );
    }

    return (
      <div>
        {errorMarkup}
        <div className="row">
          <div className="col-md-12 header-and-inputs">
            <h2>{label || selectedFactor}</h2>
            <FactorInputs propagateState={state => this.setState(state)} />
          </div>
        </div>
        <pre>{description}</pre>
        <div className="row">
          <div className="col-md-6 row">
            <div className="col-md-3" id="scoreLegend" />
            <div className="col-md-9">
              <div className="chart-wrapper">
                <canvas id="scoreChart" height={200} />
              </div>
            </div>
          </div>
          <div className="col-md-6 row">
            <div className="col-md-9">
              <div className="chart-wrapper">
                <canvas id="sectorChart" height={200} />
              </div>
            </div>
            <div className="col-md-3" id="sectorLegend" />
          </div>
        </div>
        <ReturnsChart />
        <div className="row">
          <div className="col-lg-6">
            <ReturnSummary data={_.get(this.props.factorData, "ret_summary", [])} />
          </div>
          <div className="col-lg-3">{this.renderTopBottom("top", "Top Contributors (Score 100)")}</div>
          <div className="col-lg-3">{this.renderTopBottom("bottom", "Bottom Contributors (Score 0)")}</div>
        </div>
      </div>
    );
  }
}
ReactFactor.displayName = "ReactFactor";
ReactFactor.propTypes = {
  selectedFactor: PropTypes.string,
  loadingFactor: PropTypes.bool,
  factorData: PropTypes.object,
  gicsMappings: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    selectedFactor: state.selectedFactor,
    loadingFactor: state.loadingFactor,
    factorData: state.factorData,
    gicsMappings: state.gicsMappings,
  };
}

const ReduxFactor = connect(mapStateToProps)(ReactFactor);

export { ReactFactor, ReduxFactor as Factor };

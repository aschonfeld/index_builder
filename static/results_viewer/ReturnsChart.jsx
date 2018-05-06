import qs from "querystring";

import $ from "jquery";
import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import chartUtils from "../chartUtils";
import { RET_LABELS, SAMPLE_COLORS } from "../constants";
import { fetchJsonPromise, logException } from "../fetcher";
import formatters from "../valueFormatters";

function toggleBouncer() {
  $("#chart-bouncer").toggle();
  $("#returnsChart").toggle();
}

function buildTsChart(ctxId, chartData, labels, title, colors = [chartUtils.TS_COLORS[0]]) {
  const ctx = document.getElementById(`${ctxId}Chart`);
  let chartObj = null;
  if (ctx) {
    chartUtils.fitToContainer(ctx);
    const ids = _.keys(chartData);
    chartUtils.buildLegend(`${ctxId}Legend`, ids, labels, colors);
    const datasets = _.map(_.keys(chartData), (key, i) => ({
      label: _.get(labels, key, key),
      fill: false,
      lineTension: 0.1,
      backgroundColor: colors[i],
      borderColor: colors[i],
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHitRadius: 5,
      data: _.map(chartData[key], row => ({ x: new Date(row.date), y: row.val })),
    }));
    chartObj = chartUtils.createChart(ctx, {
      type: "line",
      data: { datasets },
      options: {
        maintainAspectRatio: false,
        responsive: false,
        scales: {
          xAxes: [
            {
              type: "time",
              time: {
                min: datasets[0].data[0].x,
                max: datasets[0].data[datasets[0].data.length - 1].x,
              },
            },
          ],
        },
        tooltips: {
          mode: "index",
          callbacks: {
            title: (tooltipItems, _) => moment(tooltipItems[0].xLabel).format("MMM D YYYY"),
            label: function(tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || "";

              if (label) {
                label += ": ";
              }
              label += `${formatters.formatFloat(tooltipItem.yLabel)}`;
              return label;
            },
          },
        },
        hover: { mode: "index", intersect: true },
        legend: { display: _.size(chartData) > 1, position: "top" },
        title: { display: title !== "", text: title },
      },
    });
  }
  return chartObj;
}

function buildBarChart(ctxId, barData, title, colors) {
  const ctx = document.getElementById(`${ctxId}Chart`);
  let chartObj = null;
  if (ctx) {
    chartUtils.fitToContainer(ctx);
    const chartData = {
      labels: _.map(_.head(_.values(barData)), "date"),
      datasets: _.map(_.keys(barData), (label, i) => {
        const datasetColor = _.times(_.size(barData[label]), _.constant(colors[i]));
        return {
          label,
          data: _.map(barData[label], "val"),
          backgroundColor: datasetColor,
          borderColor: datasetColor,
          borderWidth: 0,
        };
      }),
    };
    chartObj = chartUtils.createChart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        scales: {
          yAxes: [
            {
              scaleLabel: { display: false },
              ticks: {
                callback: function(value, _index, _values) {
                  return formatters.formatFloat(value);
                },
              },
            },
          ],
          xAxes: [
            {
              offset: true,
              ticks: {
                callback: function(value, _index, _values) {
                  return moment(value).year();
                },
              },
            },
          ],
        },
        tooltips: {
          mode: "index",
          callbacks: {
            label: (tooltipItem, data) =>
              `${data.datasets[tooltipItem.datasetIndex].label || ""}: ${formatters.formatFloat(tooltipItem.yLabel)}%`,
          },
        },
        hover: { mode: "index", intersect: true },
        legend: { display: _.size(barData) > 1, position: "top" },
        title: { display: false, text: title },
      },
    });
  }
  return chartObj;
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
    if (_.isEmpty(this.props.userResults)) {
      return;
    }
    if (_.isNull(this.state.chart)) {
      const { userResults } = this.props;
      const selectedReturns = _.head(_.keys(_.get(userResults, "returns", {})));
      this.toggleReturns(selectedReturns);
    }
  }

  componentDidMount() {
    if (_.isEmpty(this.props.userResults)) {
      return;
    }
    const { userResults } = this.props;
    const selectedReturns = _.head(_.keys(_.get(userResults, "returns", {})));
    this.toggleReturns(selectedReturns);
  }

  toggleReturns(returnType) {
    const { selectedUser, selectedArchive, selectedSamples, userResults } = this.props;
    const { chart } = this.state;
    if (chart) {
      chart.destroy();
    }
    switch (returnType) {
      case "cumulative": {
        const params = { user: selectedUser, samples: _.join(selectedSamples, ","), archive: selectedArchive };
        toggleBouncer();
        fetchJsonPromise(`/index-builder/cumulative-returns?${qs.stringify(params)}`)
          .then(data => {
            toggleBouncer();
            const colors = _.map(_.keys(data), k => (k === selectedUser ? chartUtils.TS_COLORS[0] : SAMPLE_COLORS[k]));
            this.setState({ selectedReturns: returnType, chart: buildTsChart("returns", data, {}, "", colors) });
          })
          .catch(logException);
        return;
      }
      case "excess":
      case "annualized":
      default: {
        const returnData = { [selectedUser]: _.get(userResults, ["returns", returnType], []) };
        _.forEach(selectedSamples, index => {
          returnData[index] = _.get(this.props.sampleIndexes, ["returns", returnType, index], []);
        });
        const colors = _.concat([chartUtils.TS_COLORS[0]], _.map(selectedSamples, k => SAMPLE_COLORS[k]));
        this.setState({ selectedReturns: returnType, chart: buildBarChart("returns", returnData, "Returns", colors) });
        return;
      }
    }
  }

  render() {
    if (this.props.loadingUserResults) {
      return <Bouncer />;
    }
    const { userResults } = this.props;
    if (_.isNil(userResults) || _.isEmpty(userResults)) {
      return null;
    }

    return (
      <div className="row">
        <div className="col-md-12 returns">
          <div className="row returns-header">
            <div className="col-md-9 float-left align-middle">
              <strong>Returns</strong>
            </div>
            <div className="col-md-3">
              <div className="return-types float-right">
                <div className="btn-group">
                  {_.map(_.concat(_.keys(_.get(userResults, "returns", {})), ["cumulative"]), c => (
                    <button
                      key={c}
                      className={`btn ${this.state.selectedReturns === c ? "btn-primary active" : "inactive"}`}
                      onClick={() => this.toggleReturns(c)}>
                      {RET_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="chart-wrapper">
            <div id="chart-bouncer" style={{ display: "none" }}>
              <Bouncer />
            </div>
            <canvas id="returnsChart" height={200} />
          </div>
        </div>
      </div>
    );
  }
}
ReactReturnsChart.displayName = "ReactReturnsChart";
ReactReturnsChart.propTypes = {
  loadingUserResults: PropTypes.bool,
  userResults: PropTypes.object,
  sampleIndexes: PropTypes.object,
  selectedUser: PropTypes.string,
  selectedArchive: PropTypes.string,
  selectedSamples: PropTypes.array,
};

function mapStateToProps(state) {
  return {
    selectedUser: state.selectedUser,
    selectedArchive: state.selectedArchive,
    loadingUserResults: state.loadingUserResults,
    userResults: state.userResults,
    sampleIndexes: state.sampleIndexes,
  };
}

const ReduxReturnsChart = connect(mapStateToProps)(ReactReturnsChart);

export { ReactReturnsChart, ReduxReturnsChart as ReturnsChart };

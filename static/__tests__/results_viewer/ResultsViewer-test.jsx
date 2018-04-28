import { mount } from "enzyme";
import proxyquire from "proxyquire";
import React from "react";
import { Provider } from "react-redux";

import { ResultsGrid } from "../../results_viewer/ResultsGrid";
import reduxUtils from "../redux-test-utils";
import { test, withGlobalJquery } from "../test-utils";

const { actions, ReactResultsViewer, ResultsViewer, ReturnsChart } = withGlobalJquery(() => {
  const { fetcher, resultsActions } = reduxUtils.buildLibs();
  const Chart = (ctx, cfg) => {
    const chartCfg = {
      ctx,
      cfg,
      data: cfg.data,
      destroyed: false,
      getElementAtEvent: () => [{ _chart: { config: cfg }, _index: 0 }],
    };
    chartCfg.destroy = function destroy() {
      chartCfg.destroyed = true;
    };
    return chartCfg;
  };
  const chartUtils = proxyquire("../../chartUtils", { "chart.js": Chart });
  const tsChartUtils = proxyquire("../../tsChartUtils", { "./chartUtils": chartUtils });
  const BarraExposures = proxyquire("../../results_viewer/BarraExposures", {
    "../chartUtils": chartUtils,
    "../tsChartUtils": tsChartUtils,
  });
  const SectorExposures = proxyquire("../../results_viewer/SectorExposures", { "../tsChartUtils": tsChartUtils });
  const ReturnsChart = proxyquire("../../results_viewer/ReturnsChart", {
    "../fetcher": fetcher,
    "../chartUtils": chartUtils,
  });
  const { ReactResultsViewer, ResultsViewer } = proxyquire("../../results_viewer/ResultsViewer", {
    "../actions/results-viewer": resultsActions,
    "./BarraExposures": BarraExposures,
    "./ReturnsChart": ReturnsChart,
    "./SectorExposures": SectorExposures,
  });
  return { actions: resultsActions, ReactResultsViewer, ResultsViewer, ReturnsChart };
});

const EXPECTED_NAMES = [
  "sample_index_3",
  "alissa",
  "aschonfeld",
  "index",
  "sample_index_2",
  "sample_index_4",
  "sample_index_1",
];

test("ResultsViewer: rendering with redux", t => {
  const store = reduxUtils.createResultsStore();
  store.dispatch(actions.init());
  setTimeout(() => {
    const body = document.getElementsByTagName("body")[0];
    body.innerHTML += '<div id="content"></div>';
    const result = mount(
      <Provider store={store}>
        <ResultsViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );

    const grid = result.find(ResultsGrid);
    const names = grid.find("tbody tr").map(tr =>
      tr
        .find("td")
        .at(1)
        .text()
    );
    t.deepEqual(EXPECTED_NAMES, names, "should render correct names");

    let returns = result.find(ReturnsChart.ReactReturnsChart);
    let activeReturn = returns
      .find("div.return-types")
      .find("button.active")
      .text();
    returns
      .find("div.return-types")
      .find("button.inactive")
      .first()
      .simulate("click");
    result.update();
    returns = result.find(ReturnsChart.ReactReturnsChart);
    t.equal(
      activeReturn,
      returns
        .find("div.return-types")
        .find("button.inactive")
        .first()
        .text(),
      "should toggle return type"
    );
    activeReturn = returns
      .find("div.return-types")
      .find("button.active")
      .text();
    returns
      .find("div.return-types")
      .find("button.inactive")
      .last()
      .simulate("click");
    setTimeout(() => {
      result.update();
      returns = result.find(ReturnsChart.ReactReturnsChart);
      t.equal(
        activeReturn,
        returns
          .find("div.return-types")
          .find("button.inactive")
          .last()
          .text(),
        "should toggle return type"
      );

      const { selectedUser } = store.getState();
      result
        .find(ResultsGrid)
        .find("table tbody tr.unselected-row")
        .first()
        .find("td")
        .at(1)
        .simulate("click");
      setTimeout(() => {
        result.update();
        t.true(selectedUser !== store.getState().selectedUser, "should change which user they are viewing");

        result
          .find(ResultsGrid)
          .find("i.ico-check-box-outline-blank")
          .first()
          .simulate("click");
        t.ok(result.find(ReactResultsViewer).instance().state.selectedSamples.length, "should select index");

        t.end();
      }, 400);
    }, 400);
  }, 400);
});

import { mount } from "enzyme";
import proxyquire from "proxyquire";
import React from "react";
import { Provider } from "react-redux";

import { ResultsGrid } from "../../results_viewer/ResultsGrid";
import reduxUtils from "../redux-test-utils";
import { test, withGlobalJquery } from "../test-utils";

const { actions, ResultsViewer } = withGlobalJquery(() => {
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
  const { ResultsViewer } = proxyquire("../../results_viewer/ResultsViewer", {
    "../actions/results-viewer": resultsActions,
    "./BarraExposures": BarraExposures,
    "./ReturnsChart": ReturnsChart,
    "./SectorExposures": SectorExposures,
  });
  return { actions: resultsActions, ResultsViewer };
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
    t.end();
  }, 400);
});

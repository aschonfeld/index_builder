import { mount } from "enzyme";
import proxyquire from "proxyquire";
import React from "react";
import { Provider } from "react-redux";

import { FactorSelectionsGrid } from "../../summary_viewer/FactorSelectionsGrid";
import reduxUtils from "../redux-test-utils";
import { test, withGlobalJquery } from "../test-utils";

const { actions, ReactSummaryViewer, SummaryViewer } = withGlobalJquery(() => {
  const { summaryActions } = reduxUtils.buildLibs();
  const Chart = (ctx, cfg) => {
    const chartCfg = {
      ctx,
      cfg,
      data: cfg.data,
      destroyed: false,
      getElementAtEvent: evt => [{ _chart: { chart: { config: cfg } }, _index: evt.index, _datasetIndex: 0 }],
    };
    chartCfg.destroy = function destroy() {
      chartCfg.destroyed = true;
    };
    return chartCfg;
  };
  const chartUtils = proxyquire("../../chartUtils", { "chart.js": Chart });
  const summaryChartUtils = proxyquire("../../summary_viewer/summaryChartUtils", { "../chartUtils": chartUtils });
  const { ReactSummaryViewer, SummaryViewer } = proxyquire("../../summary_viewer/SummaryViewer", {
    "../actions/summary-viewer": summaryActions,
    "./summaryChartUtils": summaryChartUtils,
  });
  return { actions: summaryActions, ReactSummaryViewer, SummaryViewer };
});

test("SummaryViewer: rendering with redux", t => {
  const store = reduxUtils.createSummaryStore();
  store.dispatch(actions.init());
  setTimeout(() => {
    const body = document.getElementsByTagName("body")[0];
    body.innerHTML += '<input type="hidden" id="username" value="admin" />';
    body.innerHTML += '<input type="hidden" id="summary_viewable" value="True" /><div id="content"></div>';
    const result = mount(
      <Provider store={store}>
        <SummaryViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );
    result
      .find(ReactSummaryViewer)
      .instance()
      .componentDidUpdate();
    result.update();

    let currentTitle = result
      .find(FactorSelectionsGrid)
      .find("h2.report__title")
      .text();
    t.equal(currentTitle, 'Users Who Selected "Pro Factor 1"', "should display first factor selections");

    result
      .find(ReactSummaryViewer)
      .instance()
      .toggleReasonChart({ index: 1 });
    result.update();
    currentTitle = result
      .find(FactorSelectionsGrid)
      .find("h2.report__title")
      .text();
    t.equal(currentTitle, 'Users Who Selected "Pro Factor 2"', "should toggle factor selections");

    let summary = result.find(ReactSummaryViewer);
    const activeFactorType = summary
      .find("div.factor-types")
      .last()
      .find("button.active")
      .text();
    summary
      .find("div.factor-types")
      .last()
      .find("button.inactive")
      .first()
      .simulate("click");
    result.update();
    summary = result.find(ReactSummaryViewer);
    t.equal(
      activeFactorType,
      summary
        .find("div.factor-types")
        .last()
        .find("button.inactive")
        .first()
        .text(),
      "should toggle factor type"
    );

    result
      .find(FactorSelectionsGrid)
      .find("label.mb-1")
      .first()
      .simulate("click");
    t.ok(
      result
        .find(FactorSelectionsGrid)
        .find("label.mb-1")
        .first()
        .find("i.ico-arrow-drop-down").length,
      "should sort desc"
    );
    result
      .find(FactorSelectionsGrid)
      .find("label.mb-1")
      .first()
      .simulate("click");
    t.ok(
      result
        .find(FactorSelectionsGrid)
        .find("label.mb-1")
        .first()
        .find("i.ico-arrow-drop-up").length,
      "should sort asc"
    );
    result
      .find(FactorSelectionsGrid)
      .find("label.mb-1")
      .at(1)
      .simulate("click");
    t.false(
      result
        .find(FactorSelectionsGrid)
        .find("label.mb-1")
        .first()
        .find("i").length,
      "should change sort column"
    );

    t.end();
  }, 400);
});

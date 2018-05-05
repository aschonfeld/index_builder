import { mount } from "enzyme";
import _ from "lodash";
import proxyquire from "proxyquire";
import React from "react";
import { Provider } from "react-redux";

import { JSAnchor } from "../../JSAnchor";
import { RemovableError } from "../../RemovableError";
import reduxUtils from "../redux-test-utils";
import { test, withGlobalJquery } from "../test-utils";

const { actions, FactorViewer, Factor, FactorInputs, ReturnsChart } = withGlobalJquery(() => {
  const { factorActions } = reduxUtils.buildLibs();
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
  const ReturnsChart = proxyquire("../../factor_viewer/ReturnsChart", { "../tsChartUtils": tsChartUtils });
  const FactorInputs = proxyquire("../../factor_viewer/FactorInputs", { "../actions/factor-viewer": factorActions });
  const Factor = proxyquire("../../factor_viewer/Factor", {
    "../actions/factor-viewer": factorActions,
    "../chartUtils": chartUtils,
    "./FactorInputs": FactorInputs,
    "./ReturnsChart": ReturnsChart,
  });
  const { FactorViewer } = proxyquire("../../factor_viewer/FactorViewer", {
    "../actions/factor-viewer": factorActions,
    "./Factor": Factor,
  });
  return { actions: factorActions, FactorViewer, Factor, FactorInputs, ReturnsChart };
});

test("FactorViewer: rendering with redux", t => {
  const store = reduxUtils.createFactorStore();
  store.dispatch(actions.init());
  setTimeout(() => {
    const body = document.getElementsByTagName("body")[0];
    body.innerHTML += '<div id="content"></div>';
    const result = mount(
      <Provider store={store}>
        <FactorViewer />
      </Provider>,
      {
        attachTo: document.getElementById("content"),
      }
    );

    const options = result.find("ul.list-group");
    const factors = options.find(JSAnchor).map(a =>
      a
        .find("div span")
        .first()
        .text()
    );
    t.deepEqual(_.map(_.range(1, 14), id => `Factor ${id}`), factors, "should render correct factors");

    const factor = result.find(Factor.ReactFactor);
    t.equal(factor.instance().props.selectedFactor, "factor_1", "should select first factor");

    let returns = factor.find(ReturnsChart.ReactReturnsChart);
    const activeReturn = returns
      .find("div.return-types")
      .find("button.active")
      .text();
    returns
      .find("div.return-types")
      .find("button.inactive")
      .simulate("click");
    result.update();
    returns = result.find(Factor.ReactFactor).find(ReturnsChart.ReactReturnsChart);
    t.equal(
      activeReturn,
      returns
        .find("div.return-types")
        .find("button.inactive")
        .text(),
      "should toggle return type"
    );

    const inactiveFactor = result
      .find("ul.list-group")
      .find("a.inactive")
      .first();
    inactiveFactor.simulate("click");
    result.update();
    setTimeout(() => {
      result.update();
      t.equal(
        inactiveFactor
          .find("div span")
          .first()
          .text(),
        result
          .find(Factor.ReactFactor)
          .find("h2")
          .first()
          .text(),
        "should toggle factor"
      );

      result
        .find(FactorInputs.ReactFactorInputs)
        .instance()
        .saveFactorSettings();
      result.update();
      t.ok(result.find(RemovableError).length, "should render error");
      t.end();
    }, 10);
  }, 400);
});

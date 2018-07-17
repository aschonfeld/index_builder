import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import { JSAnchor } from "../../JSAnchor";
import { RemovableError } from "../../RemovableError";
import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { withGlobalJquery } from "../test-utils";

describe("FactorViewer", () => {
  beforeAll(() => {
    const mockBuildLibs = mockPopsicle.mock(url => {
      const { urlFetcher } = require("../redux-test-utils").default;
      return urlFetcher(url);
    });

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
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
    });

    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("rendering with redux", done => {
    const { FactorViewer } = require("../../factor_viewer/FactorViewer");
    const { ReactReturnsChart } = require("../../factor_viewer/ReturnsChart");
    const { ReactFactor } = require("../../factor_viewer/Factor");
    const { ReactFactorInputs } = require("../../factor_viewer/FactorInputs");
    const actions = require("../../actions/factor-viewer").default;

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
      expect(_.map(_.range(1, 14), id => `Factor ${id}`)).toEqual(factors);

      const factor = result.find(ReactFactor);
      expect(factor.instance().props.selectedFactor).toBe("factor_1");

      let returns = factor.find(ReactReturnsChart);
      const activeReturn = returns
        .find("div.return-types")
        .find("button.active")
        .text();
      returns
        .find("div.return-types")
        .find("button.inactive")
        .simulate("click");
      result.update();
      returns = result.find(ReactFactor).find(ReactReturnsChart);
      expect(activeReturn).toBe(
        returns
          .find("div.return-types")
          .find("button.inactive")
          .text()
      );

      const inactiveFactor = result
        .find("ul.list-group")
        .find("a.inactive")
        .first();
      inactiveFactor.simulate("click");
      result.update();
      setTimeout(() => {
        result.update();
        expect(
          inactiveFactor
            .find("div span")
            .first()
            .text()
        ).toBe(
          result
            .find(ReactFactor)
            .find("h2")
            .first()
            .text()
        );

        result
          .find(ReactFactorInputs)
          .instance()
          .saveFactorSettings();
        result.update();
        expect(result.find(RemovableError).length).toBe(1);
        done();
      }, 10);
    }, 400);
  });
});

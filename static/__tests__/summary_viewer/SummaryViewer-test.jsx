import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { withGlobalJquery } from "../test-utils";

describe("SummaryViewer", () => {
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
        getElementAtEvent: evt => [{ _chart: { chart: { config: cfg } }, _index: evt.index, _datasetIndex: 0 }],
      };
      chartCfg.destroy = function destroy() {
        chartCfg.destroyed = true;
      };
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
  });

  test("rendering with redux", done => {
    const { ReactSummaryViewer, SummaryViewer } = require("../../summary_viewer/SummaryViewer");
    const { FactorSelectionsGrid } = require("../../summary_viewer/FactorSelectionsGrid");
    const actions = require("../../actions/summary-viewer").default;

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
      expect(currentTitle).toBe('Users Who Selected "Pro Factor 1"');

      result
        .find(ReactSummaryViewer)
        .instance()
        .toggleReasonChart({ index: 1 });
      result.update();
      currentTitle = result
        .find(FactorSelectionsGrid)
        .find("h2.report__title")
        .text();
      expect(currentTitle).toBe('Users Who Selected "Pro Factor 2"');

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
      expect(activeFactorType).toBe(
        summary
          .find("div.factor-types")
          .last()
          .find("button.inactive")
          .first()
          .text()
      );

      result
        .find(FactorSelectionsGrid)
        .find("label.mb-1")
        .first()
        .simulate("click");
      expect(
        result
          .find(FactorSelectionsGrid)
          .find("label.mb-1")
          .first()
          .find("i.ico-arrow-drop-down").length
      ).toBe(1);
      result
        .find(FactorSelectionsGrid)
        .find("label.mb-1")
        .first()
        .simulate("click");
      expect(
        result
          .find(FactorSelectionsGrid)
          .find("label.mb-1")
          .first()
          .find("i.ico-arrow-drop-up").length
      ).toBe(1);
      result
        .find(FactorSelectionsGrid)
        .find("label.mb-1")
        .at(1)
        .simulate("click");
      expect(
        result
          .find(FactorSelectionsGrid)
          .find("label.mb-1")
          .first()
          .find("i").length
      ).toBe(0);

      done();
    }, 400);
  });
});

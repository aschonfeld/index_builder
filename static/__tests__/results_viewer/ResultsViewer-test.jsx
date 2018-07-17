import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { withGlobalJquery } from "../test-utils";

const EXPECTED_NAMES = [
  "sample_index_3",
  "alissa",
  "aschonfeld",
  "index",
  "sample_index_2",
  "sample_index_4",
  "sample_index_1",
];

describe("ResultsViewer", () => {
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

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
  });

  test("rendering with redux", done => {
    const { ReactResultsViewer, ResultsViewer } = require("../../results_viewer/ResultsViewer");
    const { ReactReturnsChart } = require("../../results_viewer/ReturnsChart");
    const { ResultsGrid } = require("../../results_viewer/ResultsGrid");
    const actions = require("../../actions/results-viewer").default;

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
      expect(EXPECTED_NAMES).toEqual(names);

      let returns = result.find(ReactReturnsChart);
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
      returns = result.find(ReactReturnsChart);
      expect(activeReturn).toEqual(
        returns
          .find("div.return-types")
          .find("button.inactive")
          .first()
          .text()
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
        returns = result.find(ReactReturnsChart);
        expect(activeReturn).toEqual(
          returns
            .find("div.return-types")
            .find("button.inactive")
            .last()
            .text()
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
          expect(selectedUser).not.toBe(store.getState().selectedUser);

          result
            .find(ResultsGrid)
            .find("i.ico-check-box-outline-blank")
            .first()
            .simulate("click");
          expect(result.find(ReactResultsViewer).instance().state.selectedSamples.length).toBe(1);

          result
            .find(ResultsGrid)
            .find("th label.pointer")
            .first()
            .simulate("click");
          expect(
            _.isMatch(result.find(ResultsGrid).instance().state, { sortColumn: "name", sortDirection: "ASC" })
          ).toBe(true);

          result
            .find(ResultsGrid)
            .find("th label.pointer")
            .first()
            .simulate("click");
          expect(
            _.isMatch(result.find(ResultsGrid).instance().state, { sortColumn: "name", sortDirection: "DESC" })
          ).toBe(true);

          result
            .find(ResultsGrid)
            .find("th label.pointer")
            .at(1)
            .simulate("click");
          expect(
            _.isMatch(result.find(ResultsGrid).instance().state, {
              sortColumn: "compounded return",
              sortDirection: "ASC",
            })
          ).toBe(true);

          result
            .find(ResultsGrid)
            .instance()
            .handleGridSort("compounded return", "ASC");
          expect(
            _.isMatch(result.find(ResultsGrid).instance().state, {
              sortColumn: "compounded return",
              sortDirection: "DESC",
            })
          ).toBe(true);
          result
            .find(ReactResultsViewer)
            .instance()
            .toggleUser("exception");
          done();
        }, 400);
      }, 400);
    }, 400);
  });
});

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import { Provider } from "react-redux";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";

describe("FactorUrlParams", () => {
  beforeAll(() => {
    const mockBuildLibs = mockPopsicle.mock(url => {
      const { urlFetcher } = require("../redux-test-utils").default;
      return urlFetcher(url);
    });

    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("rendering", done => {
    const FactorUrlParams = require("../../factor_viewer/FactorUrlParams").default;
    const factorActions = require("../../actions/factor-viewer").default;

    const store = reduxUtils.createFactorStore();
    history.replaceState({}, "", "?factor=2");

    mount(
      <Provider store={store}>
        <FactorUrlParams />
      </Provider>
    );
    const state = _.pick(store.getState(), ["selectedFactor"]);
    const expectedState = { selectedFactor: "2" };
    expect(state).toEqual(expectedState);

    // need to clear up history modifications because of collisions with other tests
    history.replaceState({}, "", "?");
    store.dispatch(factorActions.init());

    done();
  });
});

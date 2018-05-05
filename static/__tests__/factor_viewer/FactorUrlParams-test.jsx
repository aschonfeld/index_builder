import { mount } from "enzyme";
import _ from "lodash";
import proxyquire from "proxyquire";
import React from "react";
import { Provider } from "react-redux";

import reduxUtils from "../redux-test-utils";
import { test } from "../test-utils";

const { factorActions } = reduxUtils.buildLibs();
const FactorUrlParams = proxyquire("../../factor_viewer/FactorUrlParams", {
  "../actions/factor-viewer": factorActions,
}).default;

test("FactorUrlParams: rendering", t => {
  const store = reduxUtils.createFactorStore();
  history.replaceState({}, "", "?factor=2");

  mount(
    <Provider store={store}>
      <FactorUrlParams />
    </Provider>
  );
  const state = _.pick(store.getState(), ["selectedFactor"]);
  const expectedState = { selectedFactor: "2" };
  t.deepEqual(state, expectedState, "should read state from url");

  // need to clear up history modifications because of collisions with other tests
  history.replaceState({}, "", "?");
  store.dispatch(factorActions.init());

  t.end();
});

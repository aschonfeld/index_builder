import { mount } from "enzyme";
import $ from "jquery";
import _ from "lodash";
import proxyquire from "proxyquire";
import React from "react";

import { ReasonsSelect } from "../../factor_viewer/ReasonsSelect";
import reduxUtils from "../redux-test-utils";
import { test, withGlobalJquery } from "../test-utils";

const ReactFactorInputs = withGlobalJquery(() => {
  const { factorActions } = reduxUtils.buildLibs();
  const { ReactFactorInputs } = proxyquire("../../factor_viewer/FactorInputs", {
    "../actions/factor-viewer": factorActions,
  });
  return ReactFactorInputs;
});

test("FactorInputs: valid inputs", t => {
  const propagatedState = (() => {
    const curr = {};
    curr.propagateState = state => _.assign(curr, state);
    return curr;
  })();
  const props = {
    selectedFactor: "1",
    factorSettings: {
      factors: {
        "1": { weight: 25, reasons: ["futureRet"], strength: "HI" },
      },
    },
    saveFactorSettings: _.noop,
    propagateState: propagatedState.propagateState,
  };
  const result = mount(<ReactFactorInputs {...props} />);
  result.instance().saveFactorSettings();
  result.update();
  t.false(propagatedState.error, "should not render error");

  result
    .find(ReasonsSelect)
    .find("button.form-control")
    .simulate("click");
  t.ok(_.includes(result.html(), "Invest to affect change"), "should render Pro reasons");

  result
    .find(ReasonsSelect)
    .instance()
    .onChange("riskReduce");
  result
    .find(ReasonsSelect)
    .instance()
    .onChange("futureRet");
  t.deepEquals(["riskReduce"], result.state().reasons, "should update reasons");

  t.end();
});

test("FactorInputs: reason error", t => {
  const propagatedState = (() => {
    const curr = {};
    curr.propagateState = state => _.assign(curr, state);
    return curr;
  })();
  const props = {
    selectedFactor: "1",
    factorSettings: {
      factors: {
        "1": { weight: 25, reasons: ["futureRet"], strength: "HI" },
      },
    },
    saveFactorSettings: _.noop,
    propagateState: propagatedState.propagateState,
  };
  const body = document.getElementsByTagName("body")[0];
  body.innerHTML += '<div id="content"></div>';
  const result = mount(<ReactFactorInputs {...props} />, { attachTo: document.getElementById("content") });
  result.instance().toggleStrength("LO");

  result
    .find(ReasonsSelect)
    .find("button.form-control")
    .simulate("click");
  t.ok(_.includes(result.html(), "Factor is irrelevant"), "should render Anti reasons");
  $(".weight-input").click();
  t.false($._data(document, "events"), "should clear menu bindings");

  result.instance().saveFactorSettings();
  result.update();
  t.equal(propagatedState.error, "You must select at least one reason", "should render reason error");
  t.end();
});

test("FactorInputs: invalid weights", t => {
  const propagatedState = (() => {
    const curr = {};
    curr.propagateState = state => _.assign(curr, state);
    return curr;
  })();
  const props = {
    selectedFactor: "1",
    factorSettings: {
      factors: {
        "1": { weight: 25, reasons: ["futureRet"], strength: "HI" },
      },
    },
    saveFactorSettings: _.noop,
    propagateState: propagatedState.propagateState,
  };
  const result = mount(<ReactFactorInputs {...props} />);
  result
    .find("input")
    .first()
    .simulate("change", { target: { value: "55" } });
  result.instance().saveFactorSettings();
  result.update();
  t.equal(propagatedState.error, "Weight must be an integer from 1 to 50", "should render weight error");

  result
    .find("input")
    .first()
    .simulate("change", { target: { value: "-5" } });
  result.instance().saveFactorSettings();
  result.update();
  t.equal(propagatedState.error, "Weight must be an integer from 1 to 50", "should render weight error");

  result
    .find("input")
    .first()
    .simulate("change", { target: { value: "a" } });
  result.instance().saveFactorSettings();
  result.update();
  t.equal(propagatedState.error, "Weight must be an integer from 1 to 50", "should render weight error");

  result
    .find("input")
    .first()
    .simulate("change", { target: { value: "-.1" } });
  result.instance().saveFactorSettings();
  result.update();
  t.equal(propagatedState.error, "Weight must be an integer from 1 to 50", "should render weight error");

  result
    .find("input")
    .first()
    .simulate("change", { target: { value: "0" } });
  result.instance().saveFactorSettings();
  result.update();
  t.false(result.state().reasons.length, "should reset state");
  t.end();
});

test("FactorInputs: more than max weights", t => {
  const propagatedState = (() => {
    const curr = {};
    curr.propagateState = state => _.assign(curr, state);
    return curr;
  })();
  const props = {
    selectedFactor: "1",
    factorSettings: {
      factors: {
        "1": { weight: 5, reasons: ["futureRet"], strength: "HI" },
        "2": { weight: 20, reasons: ["futureRet"], strength: "HI" },
        "3": { weight: 25, reasons: ["futureRet"], strength: "HI" },
        "4": { weight: 25, reasons: ["futureRet"], strength: "HI" },
        "5": { weight: 25, reasons: ["futureRet"], strength: "HI" },
      },
    },
    saveFactorSettings: _.noop,
    propagateState: propagatedState.propagateState,
  };
  const result = mount(<ReactFactorInputs {...props} />);
  result
    .find("input")
    .first()
    .simulate("change", { target: { value: "10" } });
  result.instance().saveFactorSettings();
  result.update();
  t.equal(propagatedState.error, "Weights must sum up to 100", "should render weight error");
  t.end();
});

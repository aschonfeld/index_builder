import { mount } from "enzyme";
import $ from "jquery";
import _ from "lodash";
import React from "react";

import { ReasonsSelect } from "../../factor_viewer/ReasonsSelect";
import mockPopsicle from "../MockPopsicle";
import { withGlobalJquery } from "../test-utils";

describe("FactorInputs", () => {
  beforeAll(() => {
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    jest.mock("popsicle", () => mockBuildLibs);
  });

  test("valid inputs", done => {
    const { ReactFactorInputs } = require("../../factor_viewer/FactorInputs");

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
    expect(propagatedState.error).toBeUndefined();

    result
      .find(ReasonsSelect)
      .find("button.form-control")
      .simulate("click");
    expect(result.html()).toMatch("Invest to affect change");

    result
      .find(ReasonsSelect)
      .instance()
      .onChange("riskReduce");
    result
      .find(ReasonsSelect)
      .instance()
      .onChange("futureRet");
    expect(["riskReduce"]).toEqual(result.state().reasons);

    done();
  });

  test("reason error", done => {
    const { ReactFactorInputs } = require("../../factor_viewer/FactorInputs");

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
    expect(result.html()).toMatch("Factor is irrelevant");
    $(".weight-input").click();
    expect($._data(document, "events")).toBeUndefined();

    result.instance().saveFactorSettings();
    result.update();
    expect(propagatedState.error).toBe("You must select at least one reason");
    done();
  });

  test("invalid weights", done => {
    const { ReactFactorInputs } = require("../../factor_viewer/FactorInputs");

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
    expect(propagatedState.error).toBe("Weight must be an integer from 1 to 50");

    result
      .find("input")
      .first()
      .simulate("change", { target: { value: "-5" } });
    result.instance().saveFactorSettings();
    result.update();
    expect(propagatedState.error).toBe("Weight must be an integer from 1 to 50");

    result
      .find("input")
      .first()
      .simulate("change", { target: { value: "a" } });
    result.instance().saveFactorSettings();
    result.update();
    expect(propagatedState.error).toBe("Weight must be an integer from 1 to 50");

    result
      .find("input")
      .first()
      .simulate("change", { target: { value: "-.1" } });
    result.instance().saveFactorSettings();
    result.update();
    expect(propagatedState.error).toBe("Weight must be an integer from 1 to 50");

    result
      .find("input")
      .first()
      .simulate("change", { target: { value: "0" } });
    result.instance().saveFactorSettings();
    result.update();
    expect(result.state().reasons.length).toBe(0);
    done();
  });

  test("more than max weights", done => {
    const { ReactFactorInputs } = require("../../factor_viewer/FactorInputs");

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
    expect(propagatedState.error).toBe("Weights must sum up to 100");
    done();
  });
});

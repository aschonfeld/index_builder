import _ from "lodash";
import proxyquire from "proxyquire";

import reduxUtils from "./redux-test-utils";
import { test, withGlobalJquery } from "./test-utils";

const { factorActions, resultsActions, summaryActions } = reduxUtils.buildLibs();

function testMain(mainName, imports, t, isDev = false) {
  if (isDev) {
    process.env.NODE_ENV = "dev";
  }
  document.getElementsByTagName("body")[0].innerHTML += '<div id="content"></div>';
  const ReactDOM = { renderStatus: false };
  ReactDOM.render = () => {
    ReactDOM.renderStatus = true;
  };
  withGlobalJquery(() => proxyquire(`../${mainName}`, _.assign({ "react-dom": ReactDOM }, imports)));
  t.ok(ReactDOM.renderStatus, `${mainName} compiled`);
  t.end();
  if (isDev) {
    process.env.NODE_ENV = "test";
  }
}

test("factor_viewer_main rendering", t => {
  testMain("factor_viewer_main", { "./actions/factor-viewer": factorActions }, t);
});

test("factor_viewer_main dev rendering", t => {
  testMain("factor_viewer_main", { "./actions/factor-viewer": factorActions }, t, true);
});

test("results_viewer_main rendering", t => {
  testMain("results_viewer_main", { "./actions/results-viewer": resultsActions }, t);
});

test("results_viewer_main dev rendering", t => {
  testMain("results_viewer_main", { "./actions/results-viewer": resultsActions }, t, true);
});

test("summary_viewer_main rendering", t => {
  testMain("summary_viewer_main", { "./actions/summary-viewer": summaryActions }, t);
});

test("summary_viewer_main dev rendering", t => {
  testMain("summary_viewer_main", { "./actions/summary-viewer": summaryActions }, t, true);
});

test("base_styles.js loading", t => {
  require("../base_styles");
  t.pass("base_styles.js loaded");
  t.end();
});

test("polyfills.js loading", t => {
  proxyquire("../polyfills", {
    "es6-promise": { polyfill: _.noop },
    "string.prototype.startswith": {},
  });
  t.pass("polyfills.js loaded");
  t.end();
});

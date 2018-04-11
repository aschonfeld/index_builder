import { fetchJson } from "../fetcher";

const SUMMARY_URL = "/index-builder/summary-data";

function loadSummary(dispatch) {
  dispatch({ type: "loading-summary" });
  fetchJson(SUMMARY_URL, summary => {
    dispatch({ type: "loaded-summary", summary });
  });
}

function init() {
  return function(dispatch) {
    loadSummary(dispatch);
  };
}

export default { init };

import qs from "querystring";

import { fetchJson } from "../fetcher";

const SUMMARY_URL = "/index-builder/summary-data?";

function loadSummary(dispatch, getState) {
  dispatch({ type: "loading-summary" });
  const { selectedArchive } = getState();
  fetchJson(`${SUMMARY_URL}${qs.stringify({ archive: selectedArchive })}`, summary => {
    dispatch({ type: "loaded-summary", summary });
  });
}

function init() {
  return function(dispatch, getState) {
    loadSummary(dispatch, getState);
  };
}

function toggleSelectedArchive(archive) {
  return function(dispatch, getState) {
    dispatch({ type: "changed-selected-archive", archive });
    loadSummary(dispatch, getState);
  };
}

export default { init, toggleSelectedArchive };

import qs from "querystring";

import _ from "lodash";

import { fetchJson } from "../fetcher";
import { loadGicsMappings } from "./gics-mappings";

const RESULTS_URL = "/index-builder/results-stats";
const SAMPLE_INDEXES_URL = "/index-builder/sample-indexes";
const USER_RESULTS_URL = "/index-builder/user-results?";

function toggleUserResults(user) {
  return function(dispatch) {
    dispatch({ type: "changed-selected-user", user });
    fetchJson(USER_RESULTS_URL + qs.stringify({ user }), results => {
      dispatch({ type: "loaded-user-results", results });
    });
  };
}

function loadResults(dispatch) {
  dispatch({ type: "loading-results" });
  fetchJson(RESULTS_URL, results => {
    dispatch({ type: "loaded-results", results });
    const selectedUser = _(results)
      .map((userResults, user) => ({ user, val: _.get(userResults, "stats.compounded return", 0) }))
      .orderBy("val", "desc")
      .head().user;
    toggleUserResults(selectedUser)(dispatch);
  });
}

function refreshResults() {
  return dispatch => loadResults(dispatch);
}

function loadSampleIndexes(dispatch) {
  fetchJson(SAMPLE_INDEXES_URL, samples => {
    dispatch({ type: "loaded-sample-indexes", samples });
  });
}

function init() {
  return function(dispatch) {
    loadGicsMappings(dispatch);
    loadSampleIndexes(dispatch);
    loadResults(dispatch);
  };
}

export default { init, toggleUserResults, refreshResults };

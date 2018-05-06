import qs from "querystring";

import _ from "lodash";

import { fetchJson } from "../fetcher";
import { loadGicsMappings } from "./gics-mappings";

const RESULTS_URL = "/index-builder/results-stats?";
const SAMPLE_INDEXES_URL = "/index-builder/sample-indexes";
const USER_RESULTS_URL = "/index-builder/user-results?";

function toggleUserResults(user) {
  return function(dispatch, getState) {
    dispatch({ type: "changed-selected-user", user });
    const { selectedArchive } = getState();
    fetchJson(USER_RESULTS_URL + qs.stringify({ user, archive: selectedArchive }), results => {
      dispatch({ type: "loaded-user-results", results });
    });
  };
}

function loadResults(dispatch, getState) {
  dispatch({ type: "loading-results" });
  const { selectedArchive } = getState();
  fetchJson(RESULTS_URL + qs.stringify({ archive: selectedArchive }), results => {
    dispatch({ type: "loaded-results", results });
    const selectedUser = _(_.get(results, "users", {}))
      .map((userResults, user) => ({ user, val: _.get(userResults, "stats.compounded return", 0) }))
      .orderBy("val", "desc")
      .head().user;
    toggleUserResults(selectedUser)(dispatch, getState);
  });
}

function toggleSelectedArchive(archive) {
  return function(dispatch, getState) {
    dispatch({ type: "changed-selected-archive", archive });
    loadResults(dispatch, getState);
  };
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
  return function(dispatch, getState) {
    loadGicsMappings(dispatch);
    loadSampleIndexes(dispatch);
    loadResults(dispatch, getState);
  };
}

export default { init, toggleUserResults, toggleSelectedArchive, refreshResults };

import { combineReducers } from "redux";

import { gicsMappings } from "./gics-mappings";
import { selectedArchive } from "./archive";

function loadingResults(state = false, action) {
  switch (action.type) {
    case "loading-results":
      return true;
    case "loaded-results":
      return false;
    default:
      return state;
  }
}

function results(state = {}, action) {
  switch (action.type) {
    case "loaded-results":
      return action.results;
    default:
      return state;
  }
}

function selectedUser(state = null, action) {
  switch (action.type) {
    case "changed-selected-user":
      return action.user;
    default:
      return state;
  }
}

function loadingUserResults(state = false, action) {
  switch (action.type) {
    case "changed-selected-user":
      return true;
    case "loaded-user-results":
      return false;
    default:
      return state;
  }
}

function userResults(state = {}, action) {
  switch (action.type) {
    case "loaded-user-results":
      return action.results;
    default:
      return state;
  }
}

function sampleIndexes(state = {}, action) {
  switch (action.type) {
    case "loaded-sample-indexes":
      return action.samples;
    default:
      return state;
  }
}

const resultsViewer = combineReducers({
  gicsMappings,
  loadingResults,
  results,
  selectedUser,
  selectedArchive,
  loadingUserResults,
  userResults,
  sampleIndexes,
});

export default resultsViewer;

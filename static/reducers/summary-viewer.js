import _ from "lodash";
import { combineReducers } from "redux";

import { selectedArchive } from "./archive";

function loadingSummary(state = false, action) {
  switch (action.type) {
    case "loading-summary":
      return true;
    case "loaded-summary":
      return false;
    default:
      return state;
  }
}

function summary(state = {}, action) {
  switch (action.type) {
    case "loaded-summary":
      return _.get(action, "summary.data", {});
    default:
      return state;
  }
}

function archives(state = [], action) {
  switch (action.type) {
    case "loaded-summary":
      return _.get(action, "summary.archives", []);
    default:
      return state;
  }
}

const summaryViewer = combineReducers({
  loadingSummary,
  summary,
  archives,
  selectedArchive,
});

export default summaryViewer;

import { combineReducers } from "redux";

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
      return action.summary;
    default:
      return state;
  }
}

const summaryViewer = combineReducers({
  loadingSummary,
  summary,
});

export default summaryViewer;

import { combineReducers } from "redux";

import { gicsMappings } from "./gics-mappings";

function loadingFactor(state = false, action) {
  switch (action.type) {
    case "changed-selected-factor":
      return true;
    case "loaded-factor":
      return false;
  }
  return state;
}

function selectedFactor(state = null, action) {
  switch (action.type) {
    case "changed-selected-factor":
      return action.selectedFactor;
  }
  return state;
}

function factorData(state = null, action) {
  switch (action.type) {
    case "loaded-factor":
      return action.data;
  }
  return state;
}

function factors(state = [], action) {
  switch (action.type) {
    case "loaded-factors":
      return action.factors;
  }
  return state;
}

function factorSettings(state = {}, action) {
  switch (action.type) {
    case "save-factor-settings":
      return action.factorSettings;
    case "clear-factor-settings":
      return {};
  }
  return state;
}

const factorViewer = combineReducers({
  loadingFactor,
  selectedFactor,
  factorData,
  factors,
  gicsMappings,
  factorSettings,
});

export default factorViewer;

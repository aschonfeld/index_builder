import qs from "querystring";

import { getParams } from "../UrlParams";
import { fetchJson } from "../fetcher";
import { loadGicsMappings } from "./gics-mappings";
import { loadFactorSettings, saveFactorSettings } from "./factor-settings";

const FACTOR_OPTIONS_URL = "/index-builder/factor-options";
const FACTOR_DATA_URL = "/index-builder/factor-data?";

function loadFactor(dispatch, getState) {
  const { selectedFactor } = getState();
  fetchJson(FACTOR_DATA_URL + qs.stringify({ factor: selectedFactor }), data => {
    dispatch({ type: "loaded-factor", data });
  });
}

function loadFactorOptions(dispatch, getState) {
  fetchJson(FACTOR_OPTIONS_URL, factors => {
    dispatch({ type: "loaded-factors", factors });
    const { selectedFactor } = getState();
    if (!selectedFactor && factors.length) {
      dispatch({ type: "changed-selected-factor", selectedFactor: factors[0].id });
    }
    loadFactor(dispatch, getState);
  });
}

function changedSelectedFactor(selectedFactor) {
  return function(dispatch, getState) {
    dispatch({ type: "changed-selected-factor", selectedFactor });
    loadFactor(dispatch, getState);
  };
}

function init() {
  return function(dispatch, getState) {
    const { factor } = getParams();
    if (factor) {
      dispatch({ type: "changed-selected-factor", selectedFactor: factor });
    }
    loadGicsMappings(dispatch);
    loadFactorSettings(dispatch, () => loadFactorOptions(dispatch, getState));
  };
}

export default {
  init,
  changedSelectedFactor,
  saveFactorSettings,
};

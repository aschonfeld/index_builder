import qs from "querystring";
import _ from "lodash";

import { fetchJson } from "../fetcher";

const FACTOR_LOAD_URL = "/index-builder/load-factor-settings";
const FACTOR_SAVE_URL = "/index-builder/save-factor-settings?";

function loadFactorSettings(dispatch, postLoad = _.noop) {
  fetchJson(FACTOR_LOAD_URL, factorSettings => {
    dispatch({ type: "save-factor-settings", factorSettings });
    postLoad();
  });
}

function saveFactorSettings(factorSettings) {
  return function(dispatch) {
    fetchJson(FACTOR_SAVE_URL + qs.stringify({ factor_settings: JSON.stringify(factorSettings) }), newSettings => {
      if (_.has(newSettings, "error")) {
        dispatch({ type: "factor-settings-error", error: newSettings.error });
      } else {
        dispatch({ type: "save-factor-settings", factorSettings: newSettings });
      }
    });
  };
}

export { loadFactorSettings, saveFactorSettings };

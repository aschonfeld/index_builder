import _ from "lodash";

import { fetchJson } from "../fetcher";

const GICS_MAPPINGS_URL = "/index_builder/gics-mappings";

function loadGicsMappings(dispatch) {
  fetchJson(GICS_MAPPINGS_URL, data => {
    dispatch({ type: "loaded-gics-mappings", mappings: _.get(data, "mappings", {}) });
  });
}

export { loadGicsMappings };

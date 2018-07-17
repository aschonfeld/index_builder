/* eslint complexity: "off" */
/* eslint max-statements: "off" */
/* eslint max-lines: "off" */
import qs from "querystring";

import _ from "lodash";

import factorApp from "../reducers/factor-viewer";
import resultsApp from "../reducers/results-viewer";
import { createStore } from "../reducers/store";
import summaryApp from "../reducers/summary-viewer";
import GicsMappingsData from "./GicsMappings-data";
import FactorData from "./factor_viewer/Factor-data";
import FactorOptionsData from "./factor_viewer/FactorOptions-data";
import CumulativeReturnsData from "./results_viewer/CumulativeReturns-data";
import ResultsStatsData from "./results_viewer/ResultsStats-data";
import SampleIndexesData from "./results_viewer/SampleIndexes-data";
import UserResultsData from "./results_viewer/UserResults-data";
import SummaryData from "./summary_viewer/Summary-data";

function urlFetcher(url) {
  const params = qs.parse(url.split("?")[1]);
  if (url.startsWith("/index-builder/gics-mappings")) {
    return GicsMappingsData;
  }
  if (url.startsWith("/index-builder/load-factor-settings")) {
    return { factors: {}, locked: false };
  }
  if (url.startsWith("/index-builder/factor-options")) {
    return FactorOptionsData;
  }
  if (url.startsWith("/index-builder/factor-data")) {
    const label = `Factor ${_.last(params.factor.split("_"))}`;
    const updateDetails = { description: `Description of "${label}"`, id: params.factor, label };
    return _.assignIn({}, FactorData, updateDetails);
  }
  if (url.startsWith("/index-builder/results-stats")) {
    return ResultsStatsData;
  }
  if (url.startsWith("/index-builder/sample-indexes")) {
    return SampleIndexesData;
  }
  if (url.startsWith("/index-builder/user-results")) {
    if (params.user === "exception") {
      throw "Testing Exception!";
    }
    return UserResultsData;
  }
  if (url.startsWith("/index-builder/cumulative-returns")) {
    return CumulativeReturnsData;
  }
  if (url.startsWith("/index-builder/summary-data")) {
    return SummaryData;
  }
  return {};
}

function createFactorStore() {
  return createStore(factorApp);
}

function createResultsStore() {
  return createStore(resultsApp);
}

function createSummaryStore() {
  return createStore(summaryApp);
}

export default {
  urlFetcher,
  createFactorStore,
  createResultsStore,
  createSummaryStore,
};

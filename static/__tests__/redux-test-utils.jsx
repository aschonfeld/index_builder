/* eslint complexity: "off" */
/* eslint max-statements: "off" */
/* eslint max-lines: "off" */

import proxyquire from "proxyquire";

import factorApp from "../reducers/factor-viewer";
import resultsApp from "../reducers/results-viewer";
import { createStore } from "../reducers/store";
import summaryApp from "../reducers/summary-viewer";
import GicsMappingsData from "./GicsMappings-data";
import mockPopsicle from "./MockPopsicle";
import CumulativeReturnsData from "./results_viewer/CumulativeReturns-data";
import ResultsStatsData from "./results_viewer/ResultsStats-data";
import SampleIndexesData from "./results_viewer/SampleIndexes-data";
import UserResultsData from "./results_viewer/UserResults-data";

function urlFetcher(url) {
  if (url.startsWith("/index-builder/gics-mappings")) {
    return GicsMappingsData;
  }
  if (url.startsWith("/index-builder/results-stats")) {
    return ResultsStatsData;
  }
  if (url.startsWith("/index-builder/sample-indexes")) {
    return SampleIndexesData;
  }
  if (url.startsWith("/index-builder/user-results")) {
    return UserResultsData;
  }
  if (url.startsWith("/index-builder/cumulative-returns")) {
    return CumulativeReturnsData;
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

function buildLibs(fetchStrategy = urlFetcher) {
  const fetcher = proxyquire("../fetcher", {
    popsicle: mockPopsicle.mock(fetchStrategy),
  });
  const gicsMappings = proxyquire("../actions/gics-mappings", {
    "../fetcher": fetcher,
  });
  const factorSettingsActions = proxyquire("../actions/factor-settings", { "../fetcher": fetcher });
  const factorActions = proxyquire("../actions/factor-viewer", {
    "../fetcher": fetcher,
    "./factor-settings": factorSettingsActions,
    "./gics-mappings": gicsMappings,
  }).default;
  const resultsActions = proxyquire("../actions/results-viewer", {
    "../fetcher": fetcher,
    "./gics-mappings": gicsMappings,
  }).default;
  const summaryActions = proxyquire("../actions/summary-viewer", { "../fetcher": fetcher }).default;
  return {
    fetcher,
    factorActions,
    resultsActions,
    summaryActions,
  };
}

export default {
  urlFetcher,
  createFactorStore,
  createResultsStore,
  createSummaryStore,
  buildLibs,
};

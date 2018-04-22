/* eslint complexity: "off" */
/* eslint max-statements: "off" */
/* eslint max-lines: "off" */

import _ from "lodash";
import proxyquire from "proxyquire";

import factorApp from "../reducers/factor-viewer";
import resultsApp from "../reducers/results-viewer";
import { createStore } from "../reducers/store";
import summaryApp from "../reducers/summary-viewer";
import GicsMappingsData from "./GicsMappings-data";
import mockPopsicle from "./MockPopsicle";
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

function getActionMocks(mocks, mockedParams) {
  const urlMock = {};
  if (mockedParams) {
    const getParams = () => mockedParams.pop() || {};
    urlMock["../UrlParams"] = { getParams };
  }
  return _.assignIn(urlMock, mocks);
}

function buildLibs(fetchStrategy = urlFetcher, urlParams = []) {
  const fetcher = proxyquire("../fetcher", {
    popsicle: mockPopsicle.mock(fetchStrategy),
  });
  const gicsMappings = proxyquire("../actions/gics-mappings", {
    "../fetcher": fetcher,
  });
  const factorSettingsActions = proxyquire(
    "../actions/factor-settings",
    getActionMocks({ "../fetcher": fetcher }, urlParams)
  );
  const factorActions = proxyquire(
    "../actions/factor-viewer",
    getActionMocks(
      {
        "../fetcher": fetcher,
        "./factor-settings": factorSettingsActions,
        "./gics-mappings": gicsMappings,
      },
      urlParams
    )
  ).default;
  const resultsActions = proxyquire(
    "../actions/results-viewer",
    getActionMocks({ "../fetcher": fetcher, "./gics-mappings": gicsMappings }, urlParams)
  ).default;
  const summaryActions = proxyquire("../actions/summary-viewer", getActionMocks({ "../fetcher": fetcher }, urlParams))
    .default;
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

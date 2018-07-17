import _ from "lodash";

import mockPopsicle from "./MockPopsicle";
import { withGlobalJquery } from "./test-utils";

function testMain(mainName, done, isDev = false) {
  if (isDev) {
    process.env.NODE_ENV = "dev";
  }
  document.getElementsByTagName("body")[0].innerHTML += '<div id="content"></div>';
  const mockReactDOM = { renderStatus: false };
  mockReactDOM.render = () => {
    mockReactDOM.renderStatus = true;
  };
  withGlobalJquery(() => jest.mock("react-dom", () => mockReactDOM));
  require(`../${mainName}`);
  expect(mockReactDOM.renderStatus).toBe(true);
  if (isDev) {
    process.env.NODE_ENV = "test";
  }
  done();
}

describe("main tests", () => {
  beforeEach(() => {
    jest.resetModules();
    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("./redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    jest.mock("popsicle", () => mockBuildLibs);
  });

  _.forEach(["factor", "results", "summary"], page => {
    test(`${page}_viewer_main rendering`, done => {
      testMain(`${page}_viewer_main`, done);
    });
    test(`${page}_viewer_main dev rendering`, done => {
      testMain(`${page}_viewer_main`, done, true);
    });
  });

  test("base_styles.js loading", done => {
    require("../base_styles");
    done();
  });

  test("polyfills.js loading", done => {
    const mockES6Promise = { polyfill: _.noop };
    jest.mock("es6-promise", () => mockES6Promise);
    jest.mock("string.prototype.startswith", () => ({}));
    require("../polyfills");
    done();
  });
});

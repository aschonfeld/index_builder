import { test as tapeCatchTest } from "tape-catch";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import _ from "lodash";

// Run a test with the same API as tap:
//   https://github.com/substack/tape/#methods
// but with the following extra features:
//
// * catch exceptions as test failures, rather than just terminating
// * reset the HTML DOM, so each test has a clean state.
function test(message, callback) {
  return tapeCatchTest(message, t => {
    configure({ adapter: new Adapter() });

    const body = document.body;

    // http://stackoverflow.com/a/683429/509706
    while (body.hasChildNodes()) {
      body.removeChild(body.lastChild);
    }

    return callback(t);
  });
}

function withGlobalJquery(callback) {
  global.jQuery = require("jquery");
  const results = callback();
  delete global.jQuery;
  return results;
}

function replaceNBSP(text) {
  return text.replace(/\s/g, " ");
}

function logException(e) {
  console.error(`${e.name}: ${e.message} (${e.fileName}:${e.lineNumber})`);
  console.error(e.stack);
}

function timeoutChain(tests, result, t) {
  try {
    if (tests.length) {
      const [pre, post] = _.head(tests);
      pre(result);
      setTimeout(() => {
        result.update();
        post(result, t);
        timeoutChain(_.tail(tests), result, t);
      }, 400);
    } else {
      t.end();
    }
  } catch (err) {
    logException(err);
    t.end();
  }
}

export { test, withGlobalJquery, replaceNBSP, timeoutChain, logException };

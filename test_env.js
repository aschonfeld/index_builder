const hook = require("node-hook");
require("jsdom-global")(undefined, { url: "http://www.example.com" });

// Do nothing when we encounter require('foo.css'); calls.
function skipFile() {
  // Pretend the .css file is an empty JS file:
  return "";
}
hook.hook(".css", skipFile);

// Provided that we're run *after* babel-register, we can load
// filter_console, even though it's ES6.
const filterConsole = require("./static/filter_console");
filterConsole.default.ignoreDatagridWarnings();
filterConsole.default.ignoreConsoleErrors(/This browser doesn't support the `onScroll` event/);

// required for react 16
global.requestAnimationFrame = function(callback) {
  setTimeout(callback, 0);
};

// required for react-data-grid & react-bootstrap-modal in react 16
require("./static/adapter-for-react-16");

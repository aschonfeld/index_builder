import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import actions from "./actions/results-viewer";
import "./adapter-for-react-16";
import filterConsole from "./filter_console";
import app from "./reducers/results-viewer";
import { createStore } from "./reducers/store";
import { ResultsViewer } from "./results_viewer/ResultsViewer";

const store = createStore(app);
store.dispatch(actions.init());

if (process.env.NODE_ENV == "dev") {
  filterConsole.ignoreDatagridWarnings();
}

const rootNode = (
  <Provider store={store}>
    <ResultsViewer />
  </Provider>
);

ReactDOM.render(rootNode, document.getElementById("content"));

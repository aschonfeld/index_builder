import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import actions from "./actions/summary-viewer";
import "./adapter-for-react-16";
import filterConsole from "./filter_console";
import { createStore } from "./reducers/store";
import app from "./reducers/summary-viewer";
import { SummaryViewer } from "./summary_viewer/SummaryViewer";

const store = createStore(app);
store.dispatch(actions.init());

if (process.env.NODE_ENV == "dev") {
  filterConsole.ignoreDatagridWarnings();
}

const rootNode = (
  <Provider store={store}>
    <SummaryViewer />
  </Provider>
);

ReactDOM.render(rootNode, document.getElementById("content"));

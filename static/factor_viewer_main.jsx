import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import actions from "./actions/factor-viewer";
import "./adapter-for-react-16";
import { FactorViewer } from "./factor_viewer/FactorViewer";
import filterConsole from "./filter_console";
import app from "./reducers/factor-viewer";
import { createStore } from "./reducers/store";

const store = createStore(app);
store.dispatch(actions.init());

if (process.env.NODE_ENV == "dev") {
  filterConsole.ignoreDatagridWarnings();
}

const rootNode = (
  <Provider store={store}>
    <FactorViewer />
  </Provider>
);

ReactDOM.render(rootNode, document.getElementById("content"));

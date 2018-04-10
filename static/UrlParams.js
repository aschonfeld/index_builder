import querystring from "querystring";

import _ from "lodash";
import React from "react";

// TODO: this is generic enough to open source.

function isJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function getParams() {
  const params = {};
  const queryParams = querystring.parse(window.location.search.replace(/^.*\?/, ""));
  _.forEach(queryParams, (value, key) => {
    if (value) {
      if (_.includes(value, ",") && !isJSON(value)) {
        value = value.split(",");
      }
      params[key] = value;
    }
  });
  return params;
}

// Capitalize the first letter of the string given.
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class UrlParams extends React.Component {
  constructor(props) {
    super(props);
    this.state = { oldOnPopState: null };
    this.callOnChangeFunctions = this.callOnChangeFunctions.bind(this);
  }

  callOnChangeFunctions() {
    const params = getParams();
    for (const key in params) {
      const propValue = this.props[key];
      const urlValue = params[key];

      const onChangeFuncName = `on${capitalize(key)}Change`;
      const onChangeFunc = this.props[onChangeFuncName];
      // If we find a url parameter foo, try to call onFooChange, if it's defined.
      if (urlValue && urlValue != propValue && onChangeFunc) {
        onChangeFunc.call(this, urlValue);
      }
    }
  }

  // Once we're loaded, hook into the history API to spot any changes
  componentDidMount() {
    // If we have any props that don't match the URL on page load,
    // call onFooChange immediately.
    this.callOnChangeFunctions();

    if (window.onpopstate) {
      this.setState({ oldOnPopState: window.onpopstate });
    }

    window.onpopstate = event => {
      this.callOnChangeFunctions();

      // Call any other onpopstate handlers.
      if (this.state.oldOnPopState) {
        this.state.oldOnPopState.call(window, event);
      }
    };
  }
  // Cleanup window.onpopstate.
  componentWillUnmount() {
    window.onpopstate = this.state.oldOnPopState;
  }

  componentWillReceiveProps(newProps) {
    const dataProps = _.omitBy(newProps, (_value, key) => key.startsWith("on"));

    let shouldUpdateUrl = false;
    const urlParams = getParams();
    for (const key in dataProps) {
      // Deliberately allow null to equal undefined.
      if (dataProps[key] != urlParams[key]) {
        shouldUpdateUrl = true;
        break;
      }
    }

    if (shouldUpdateUrl) {
      // omitting 'key' prop because we won't need it after the inital load of the page
      const newParams = _.omit(_.assignIn(urlParams, dataProps), "key");
      history.pushState({}, "", "?" + querystring.stringify(newParams));
    }
  }

  render() {
    return null;
  }
}
UrlParams.displayName = "UrlParams";

export { UrlParams, getParams };

import PropTypes from "prop-types";
import React from "react";

import { JSAnchor } from "./JSAnchor";

class ReportTitleRow extends React.Component {
  constructor(props) {
    super(props);
    this.renderRefresh = this.renderRefresh.bind(this);
    this.renderLastCached = this.renderLastCached.bind(this);
  }

  renderLastCached() {
    if (this.props.lastCached) {
      return (
        <div className="col text-right">
          <span className="lastCached report__sync">
            <span className="label">Last Cached:</span>
            {`${this.props.lastCached} `}
          </span>
          {this.renderRefresh()}
        </div>
      );
    }
    return null;
  }

  renderRefresh() {
    if (this.props.refresh) {
      return (
        <JSAnchor styleClass="btn btn-secondary btn-ico">
          <i className="ico-sync" onClick={this.props.refresh} />
        </JSAnchor>
      );
    }
    return null;
  }

  render() {
    return (
      <caption>
        <div className="row">
          <div className="col text-nowrap">
            <h2 className="report__title">{this.props.title}</h2>
          </div>
          {this.renderLastCached()}
        </div>
      </caption>
    );
  }
}
ReportTitleRow.displayName = "ReportTitleRow";
ReportTitleRow.propTypes = {
  title: PropTypes.node,
  refresh: PropTypes.func,
  lastCached: PropTypes.string,
};

export default ReportTitleRow;

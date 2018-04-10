import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { JSAnchor } from "./JSAnchor";

class ReportTitleRow extends React.Component {
  constructor(props) {
    super(props);
    this.renderRefresh = this.renderRefresh.bind(this);
    this.renderLastCached = this.renderLastCached.bind(this);
    this.renderInfo = this.renderInfo.bind(this);
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

  renderInfo() {
    const info = _.map(this.props.info || [], i => {
      const { snapshot, tag } = i;
      if (snapshot) {
        let dateStr = snapshot.substring(0, 8);
        dateStr = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        return tag ? `${dateStr} [${tag}]` : dateStr;
      } else {
        return tag || "";
      }
    });
    const curr = _.head(info);
    let history = _.tail(info);
    if (_.isEmpty(history)) {
      history = null;
    } else {
      history = `(${_.join(history, ", ")})`;
    }
    return (
      <p className="report__date">
        {curr} <span className="data--history">{history}</span>
      </p>
    );
  }

  render() {
    return (
      <caption>
        <div className="row">
          <div className="col text-nowrap">
            <h2 className="report__title">{this.props.title}</h2>
            {this.renderInfo()}
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
  info: PropTypes.arrayOf(PropTypes.object),
};
ReportTitleRow.defaultProps = {
  snapshots: [],
  tags: [],
};

export default ReportTitleRow;

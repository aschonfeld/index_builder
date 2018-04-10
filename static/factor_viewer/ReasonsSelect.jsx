import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { REASON_LABELS } from "../constants";
import menuUtils from "../menuUtils";

class ReasonsSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
    this.onChange = this.onChange.bind(this);
  }

  onChange(currSelection) {
    if (_.includes(this.props.reasons, currSelection)) {
      this.props.onChange(_.without(this.props.reasons, currSelection));
    } else {
      this.props.onChange(_.concat(this.props.reasons, [currSelection]));
    }
  }

  render() {
    const { reasons, strength, disabled } = this.props;
    const selectionsText = _.join(
      _.map(_.filter(_.get(REASON_LABELS, strength), ({ key }) => _.includes(reasons, key)), "label"),
      ", "
    );
    if (disabled) {
      return (
        <div className="reasons-select">
          <div className="input-group">
            <span className="input-group-addon">Reasons</span>
            <input type="text" className="form-control" value={selectionsText} disabled />
          </div>
        </div>
      );
    }
    const reasonsMarkup = _.map(_.get(REASON_LABELS, strength), ({ key, label }, idx) => {
      let icon = "";
      if (!_.includes(reasons, key)) {
        icon = "-outline-blank";
      }
      return (
        <li key={idx}>
          <span>
            <button className="btn btn-plain" onClick={() => this.onChange(key)}>
              <i className={`ico-check-box${icon}`} />
              <span>{label}</span>
            </button>
          </span>
        </li>
      );
    });

    const menuHandler = menuUtils.openMenu(
      "reasons",
      () => this.setState({ open: true }),
      () => this.setState({ open: false })
    );
    return (
      <div className="reasons-select">
        <div className="input-group">
          <span className="input-group-addon">Reasons</span>
          <div className="column-toggle">
            <button className="form-control" onClick={menuHandler}>
              <span>{_.truncate(selectionsText, { length: 45 })}</span>
              <i className="ico-arrow-drop-down" />
            </button>
            <div className="column-toggle__dropdown" hidden={!this.state.open}>
              <div className="menu-scrollable">
                <ul>{reasonsMarkup}</ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
ReasonsSelect.displayName = "ReasonsSelect";
ReasonsSelect.propTypes = {
  onChange: PropTypes.func,
  strength: PropTypes.string,
  reasons: PropTypes.array,
  disabled: PropTypes.bool,
};

export { ReasonsSelect };

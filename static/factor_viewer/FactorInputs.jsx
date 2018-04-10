import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import actions from "../actions/factor-viewer";
import { STRENGTH_LABELS } from "../constants";
import { ReasonsSelect } from "./ReasonsSelect";

const BASE_STATE = {
  weight: null,
  strength: "HI",
  reasons: [],
};

class ReactFactorInputs extends React.Component {
  constructor(props) {
    super(props);
    this.state = _.get(props.factorSettings.factors, props.selectedFactor, BASE_STATE);
    this.toggleStrength = this.toggleStrength.bind(this);
    this.saveFactorSettings = this.saveFactorSettings.bind(this);
  }

  toggleStrength(strength) {
    this.setState({ strength, reasons: [] });
  }

  saveFactorSettings() {
    const { selectedFactor, factorSettings } = this.props;
    const { factors } = factorSettings;
    const { strength, weight, reasons } = this.state;
    if (!_.size(reasons)) {
      this.props.propagateState({ error: "You must select at least one reason" });
      return;
    }
    if (!weight) {
      this.props.saveFactorSettings(_.omit(factors, selectedFactor));
      this.setState(BASE_STATE);
      return;
    }
    const weightInt = parseInt(weight);
    if (weightInt == 0) {
      this.props.saveFactorSettings(_.omit(factors, selectedFactor));
      this.setState(BASE_STATE);
      return;
    }
    if (weightInt < 1 || weightInt > 50 || _.isNil(weightInt) || _.isNaN(weightInt)) {
      this.props.propagateState({ error: "Weight must be an integer from 1 to 50" });
      return;
    }
    const updatedFactorSettings = _.assignIn({}, factors, {
      [selectedFactor]: { strength, weight: weightInt, reasons },
    });
    if (_.sum(_.map(updatedFactorSettings, "weight")) > 100) {
      this.props.propagateState({ error: "Weights must sum up to 100" });
      return;
    }
    this.props.saveFactorSettings(updatedFactorSettings);
  }

  render() {
    const { strength, weight, reasons } = this.state;
    let buttonMarkup = null;
    if (!this.props.factorSettings.locked) {
      buttonMarkup = (
        <button className="btn btn-primary save-inputs" onClick={this.saveFactorSettings}>
          Save
        </button>
      );
    }
    return (
      <div className="factor-inputs">
        <div className="strength-input">
          <div className="input-group">
            <span className="input-group-addon">Direction</span>
            <select
              value={strength || ""}
              className="form-control custom-select"
              onChange={event => this.toggleStrength(event.target.value)}
              disabled={this.props.factorSettings.locked}>
              {_.map(STRENGTH_LABELS, (label, value) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="weight-input">
          <div className="input-group">
            <span className="input-group-addon">Weight</span>
            <input
              type="text"
              className="form-control"
              value={weight || ""}
              onChange={event => this.setState({ weight: event.target.value })}
              disabled={this.props.factorSettings.locked}
            />
          </div>
        </div>
        <ReasonsSelect
          reasons={reasons}
          strength={strength}
          onChange={reasons => this.setState({ reasons })}
          disabled={this.props.factorSettings.locked}
        />
        {buttonMarkup}
      </div>
    );
  }
}
ReactFactorInputs.displayName = "ReactFactorInputs";
ReactFactorInputs.propTypes = {
  selectedFactor: PropTypes.string,
  factorSettings: PropTypes.object,
  saveFactorSettings: PropTypes.func,
  propagateState: PropTypes.func,
};

function mapStateToProps(state) {
  return {
    selectedFactor: state.selectedFactor,
    factorSettings: state.factorSettings,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    saveFactorSettings: factorSettings => dispatch(actions.saveFactorSettings(factorSettings)),
  };
}

const ReduxFactorInputs = connect(mapStateToProps, mapDispatchToProps)(ReactFactorInputs);

export { ReactFactorInputs, ReduxFactorInputs as FactorInputs };

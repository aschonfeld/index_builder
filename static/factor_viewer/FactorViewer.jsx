import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";

import { JSAnchor } from "../JSAnchor";
import actions from "../actions/factor-viewer";
import { Factor } from "./Factor";
import FactorUrlParams from "./FactorUrlParams";

require("./FactorViewer.css");

class ReactFactorViewer extends React.Component {
  constructor(props) {
    super(props);
    this.renderFactorOptions = this.renderFactorOptions.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return !_.isEqual(this.props, newProps);
  }

  renderFactorOptions() {
    const { factors, selectedFactor, factorSettings } = this.props;
    const remainingWeight = 100 - _.sum(_.map(_.get(factorSettings, "factors", {}), "weight"));
    const indexOptions = _.map(factors, (index, idx) => {
      const selected = selectedFactor === index.id;
      const props = {
        styleClass: `list-group-item list-group-item-action ${selected ? "" : "in"}active`,
        key: idx,
        onClick: selected ? _.noop : () => this.props.selectedFactorChange(index.id),
      };
      let weight = _.get(factorSettings, ["factors", index.id, "weight"]);
      if (weight) {
        weight = `${weight}%`;
      }
      return (
        <JSAnchor {...props}>
          <div>
            <span>{index.label}</span>
            <span className="option-weight">{weight}</span>
          </div>
        </JSAnchor>
      );
    });
    if (indexOptions.length) {
      return (
        <div>
          <div className="row">
            <div className="col-md-12">
              <div className={`alert ${remainingWeight ? "alert-primary" : "alert-success"} remaining-weight`}>
                {"% Remaining to Allocate:"}
                <strong className="pl-3">{remainingWeight}</strong>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <ul className="list-group Sections">{indexOptions}</ul>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  render() {
    return (
      <div className="FactorViewer">
        <FactorUrlParams />
        <div className="row">
          <div className="col-md-2">{this.renderFactorOptions()}</div>
          <div className="col-md-10">
            <Factor />
          </div>
        </div>
      </div>
    );
  }
}
ReactFactorViewer.displayName = "ReactFactorViewer";
ReactFactorViewer.propTypes = {
  selectedFactor: PropTypes.string,
  factors: PropTypes.arrayOf(PropTypes.object),
  factorSettings: PropTypes.object,
  selectedFactorChange: PropTypes.func,
  refresh: PropTypes.func,
  exportGrid: PropTypes.func,
};

function mapStateToProps(state) {
  return {
    selectedFactor: state.selectedFactor,
    factors: state.factors,
    loadingFactor: state.loadingFactor,
    factorSettings: state.factorSettings,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    selectedFactorChange: index => dispatch(actions.changedSelectedFactor(index)),
  };
}

const ReduxFactorViewer = connect(mapStateToProps, mapDispatchToProps)(ReactFactorViewer);

export { ReactFactorViewer, ReduxFactorViewer as FactorViewer };

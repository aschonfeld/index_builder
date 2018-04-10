import { connect } from "react-redux";

import { UrlParams } from "../UrlParams";
import actions from "../actions/factor-viewer";

function mapStateToProps(state) {
  return {
    factor: state.selectedFactor,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onFactorChange: factor => dispatch(actions.changedSelectedFactor(factor)),
  };
}

const FactorUrlParams = connect(mapStateToProps, mapDispatchToProps)(UrlParams);

export default FactorUrlParams;

import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

class JSAnchor extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { onClick, styleClass, children } = this.props;
    return (
      <a href="javascript:void(0)" onClick={onClick} className={styleClass}>
        {children}
      </a>
    );
  }
}
JSAnchor.displayName = "JSAnchor";
JSAnchor.propTypes = {
  styleClass: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
};
JSAnchor.defaultProps = { onClick: _.noop, styleClass: "" };

export { JSAnchor };

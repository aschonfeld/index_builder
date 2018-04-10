import PropTypes from "prop-types";
import React from "react";

class RemovableError extends React.Component {
  constructor(props) {
    super(props);
    this.traceback = this.traceback.bind(this);
    this.remove = this.remove.bind(this);
  }

  traceback() {
    if (this.props.traceback) {
      return (
        <div className="traceback">
          <pre>{this.props.traceback}</pre>
        </div>
      );
    }
    return null;
  }

  remove() {
    if (this.props.onRemove) {
      return <i className="ico-cancel float-right" onClick={this.props.onRemove} />;
    }

    return null;
  }

  render() {
    return (
      <div className="index-builder-alert alert alert-danger" role="alert">
        <i className="ico-error" />
        <span>{this.props.message}</span>
        {this.remove()}
        {this.traceback()}
        {this.props.children}
      </div>
    );
  }
}
RemovableError.displayName = "RemovableError";
RemovableError.propTypes = {
  message: PropTypes.string.isRequired,
  traceback: PropTypes.string,
  onRemove: PropTypes.func,
  children: PropTypes.node,
};

export { RemovableError };

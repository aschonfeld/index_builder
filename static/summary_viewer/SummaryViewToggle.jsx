import _ from "lodash";
import React from "react";

class SummaryViewToggle extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const username = document.getElementById("username").value;
    if (username === "admin") {
      const summaryViewable = document.getElementById("summary_viewable").value === "True";
      const toggleSummaryVisible = action => () => {
        location.href = `/index-builder/${action}-summary`;
      };
      return [
        <strong key={1} className="pr-5 float-left mt-3">
          Summary Page For All Users
        </strong>,
        <div key={2} className="factor-types summary-toggle">
          <div className="btn-group">
            <button
              className={`btn ${summaryViewable ? "inactive" : "btn-primary active"}`}
              onClick={summaryViewable ? toggleSummaryVisible("lock") : _.noop}>
              Hidden
            </button>
            <button
              className={`btn ${summaryViewable ? "btn-primary active" : "inactive"}`}
              onClick={summaryViewable ? _.noop : toggleSummaryVisible("unlock")}>
              Visible
            </button>
          </div>
        </div>,
      ];
    }
    return null;
  }
}
SummaryViewToggle.displayName = "SummaryViewToggle";

export { SummaryViewToggle };

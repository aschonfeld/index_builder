import _ from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";

class ArchivePicker extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const archives = _.orderBy(
      _.map(this.props.archives, archive => {
        const archiveSegs = _.split(archive, "_");
        let tag = null;
        const timestamp = moment(_.tail(archiveSegs), "YYYYMMDDHHmmss");
        if (archiveSegs.length > 1) {
          tag = `${_.join(_.initial(archiveSegs), " ")} `;
        }
        return { archive, tag: `${tag || ""}${timestamp.format("M/D/YYYY h:mm:ss")}`, timestamp };
      }),
      "timestamp",
      "desc"
    );
    if (_.size(archives)) {
      return (
        <div className="input-group archives">
          <span className="input-group-addon">Snapshot</span>
          <select
            value={this.props.selectedArchive || ""}
            className="form-control custom-select"
            onChange={event => this.props.toggleArchive(event.target.value)}>
            <option value={""}>Active Users</option>
            {_.map(archives, ({ archive, tag }) => (
              <option key={archive} value={archive}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return null;
  }
}
ArchivePicker.displayName = "ArchivePicker";
ArchivePicker.propTypes = {
  archives: PropTypes.array,
  selectedArchive: PropTypes.string,
  toggleArchive: PropTypes.func,
};
ArchivePicker.defaultProps = { archives: [] };

export { ArchivePicker };

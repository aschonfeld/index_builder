import _ from "lodash";

function sortHandler(currCol, currDir, newCol, newDir) {
  // for some reason react-data-grid keeps sending over 'ASC'
  if (currCol === newCol) {
    if (currDir === newDir) {
      return { sortColumn: newCol, sortDirection: newDir === "ASC" ? "DESC" : "ASC" };
    }
  }
  return { sortColumn: newCol, sortDirection: newDir };
}

function filterHandler(currFilters, newFilter) {
  const newFilters = _.assign({}, currFilters);
  if (newFilter.filterTerm) {
    newFilters[newFilter.column.key] = newFilter;
  } else {
    delete newFilters[newFilter.column.key];
  }
  return newFilters;
}

export default {
  sortHandler,
  filterHandler,
};

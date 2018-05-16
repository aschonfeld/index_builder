function sortHandler(currCol, currDir, newCol, newDir) {
  // for some reason react-data-grid keeps sending over 'ASC'
  if (currCol === newCol && currDir === newDir) {
    return { sortColumn: newCol, sortDirection: newDir === "ASC" ? "DESC" : "ASC" };
  }
  return { sortColumn: newCol, sortDirection: newDir };
}

export default {
  sortHandler,
};

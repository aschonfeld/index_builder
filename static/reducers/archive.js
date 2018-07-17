function selectedArchive(state = null, action) {
  switch (action.type) {
    case "changed-selected-archive":
      return action.archive;
    default:
      return state;
  }
}

export { selectedArchive };

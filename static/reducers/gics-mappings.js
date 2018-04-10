function gicsMappings(state = {}, action) {
  switch (action.type) {
    case "loaded-gics-mappings":
      return action.mappings;
    default:
      return state;
  }
}

export { gicsMappings };

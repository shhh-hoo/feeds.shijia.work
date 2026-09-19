import type { ItemStateMap, SavedItemMap } from "../types";

export function mergeStateMaps(
  local: ItemStateMap,
  remote: ItemStateMap
): ItemStateMap {
  const merged = { ...local };

  for (const [id, remoteState] of Object.entries(remote)) {
    const localState = merged[id];
    if (!localState || remoteState.updatedAt > localState.updatedAt) {
      merged[id] = remoteState;
    }
  }

  return merged;
}

export function findLocalNewerStates(
  local: ItemStateMap,
  remote: ItemStateMap
): ItemStateMap {
  return Object.fromEntries(
    Object.entries(local).filter(([id, state]) => {
      const remoteState = remote[id];
      return !remoteState || state.updatedAt > remoteState.updatedAt;
    })
  );
}

export function mergeSavedItems(
  local: SavedItemMap,
  remote: SavedItemMap
): SavedItemMap {
  return { ...local, ...remote };
}

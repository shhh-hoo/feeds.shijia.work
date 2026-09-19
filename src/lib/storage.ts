import type { ItemState, ItemStateMap } from "../types";

const KEY = "feeds.shijia.work:item-state:v1";

export function readItemStates(): ItemStateMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ItemStateMap) : {};
  } catch {
    return {};
  }
}

export function writeItemStates(states: ItemStateMap) {
  localStorage.setItem(KEY, JSON.stringify(states));
}

export function mergeItemState(
  states: ItemStateMap,
  id: string,
  patch: Omit<ItemState, "updatedAt">
): ItemStateMap {
  return {
    ...states,
    [id]: {
      ...states[id],
      ...patch,
      updatedAt: new Date().toISOString()
    }
  };
}

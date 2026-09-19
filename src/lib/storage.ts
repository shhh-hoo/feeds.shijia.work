import type { ItemState, ItemStateMap } from "../types";

const KEY = "feeds.shijia.work:item-state:v1";
type StateKey = keyof Omit<ItemState, "updatedAt">;

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

export function mergeItemState<K extends StateKey>(
  states: ItemStateMap,
  id: string,
  key: K,
  value: ItemState[K]
): ItemStateMap {
  return {
    ...states,
    [id]: {
      ...states[id],
      [key]: value,
      updatedAt: new Date().toISOString()
    }
  };
}

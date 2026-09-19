import type { FeedItem, ItemState, ItemStateMap, SavedItemMap } from "../types";

const STATE_KEY = "feeds.shijia.work:item-state:v2";
const LEGACY_STATE_KEY = "feeds.shijia.work:item-state:v1";
const SAVED_ITEMS_KEY = "feeds.shijia.work:saved-items:v1";

type StateKey = keyof Omit<ItemState, "updatedAt">;

function migrateLegacyStates(raw: string): ItemStateMap {
  const legacy = JSON.parse(raw) as Record<
    string,
    {
      saved?: boolean;
      consumed?: boolean;
      skipped?: boolean;
      liked?: boolean;
      updatedAt?: string;
    }
  >;

  return Object.fromEntries(
    Object.entries(legacy).map(([id, state]) => [
      id,
      {
        read: Boolean(state.consumed),
        saved: Boolean(state.saved),
        skipped: Boolean(state.skipped),
        liked: Boolean(state.liked),
        updatedAt: state.updatedAt ?? new Date(0).toISOString()
      }
    ])
  );
}

export function readItemStates(): ItemStateMap {
  try {
    const current = localStorage.getItem(STATE_KEY);
    if (current) return JSON.parse(current) as ItemStateMap;

    const legacy = localStorage.getItem(LEGACY_STATE_KEY);
    if (!legacy) return {};

    const migrated = migrateLegacyStates(legacy);
    writeItemStates(migrated);
    return migrated;
  } catch {
    return {};
  }
}

export function writeItemStates(states: ItemStateMap) {
  localStorage.setItem(STATE_KEY, JSON.stringify(states));
}

export function readSavedItems(): SavedItemMap {
  try {
    const raw = localStorage.getItem(SAVED_ITEMS_KEY);
    return raw ? (JSON.parse(raw) as SavedItemMap) : {};
  } catch {
    return {};
  }
}

export function writeSavedItems(items: SavedItemMap) {
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
}

export function setSavedItem(items: SavedItemMap, item: FeedItem, saved: boolean) {
  if (saved) {
    return { ...items, [item.id]: item };
  }

  const next = { ...items };
  delete next[item.id];
  return next;
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

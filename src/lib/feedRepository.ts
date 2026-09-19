import { fallbackFeed } from "../data/fallbackFeed";
import { findLocalNewerStates, mergeSavedItems, mergeStateMaps } from "./stateSync";
import type {
  DailyFeedSnapshot,
  FeedItem,
  ItemState,
  ItemStateMap,
  SavedItemMap
} from "../types";

function isFeedSnapshot(value: unknown): value is DailyFeedSnapshot {
  if (!value || typeof value !== "object") return false;
  const feed = value as Partial<DailyFeedSnapshot>;
  return (
    feed.version === 1 &&
    typeof feed.date === "string" &&
    typeof feed.timezone === "string" &&
    Array.isArray(feed.items)
  );
}

export async function loadFeed(date = fallbackFeed.date): Promise<DailyFeedSnapshot> {
  try {
    const response = await fetch("/api/feed?date=" + encodeURIComponent(date), {
      headers: { accept: "application/json" }
    });
    if (!response.ok) return fallbackFeed;
    const value = (await response.json()) as unknown;
    return isFeedSnapshot(value) ? value : fallbackFeed;
  } catch {
    return fallbackFeed;
  }
}

export type RemoteStateBundle = {
  states: ItemStateMap;
  savedItems: SavedItemMap;
  writeEnabled: boolean;
};

export async function loadRemoteStateBundle(): Promise<RemoteStateBundle | null> {
  try {
    const response = await fetch("/api/state", {
      headers: { accept: "application/json" }
    });
    if (!response.ok) return null;

    const value = (await response.json()) as {
      states?: ItemStateMap;
      savedItems?: SavedItemMap;
      writeEnabled?: boolean;
    };

    return {
      states: value.states ?? {},
      savedItems: value.savedItems ?? {},
      writeEnabled: Boolean(value.writeEnabled)
    };
  } catch {
    return null;
  }
}

export async function syncState(
  item: FeedItem,
  briefingDate: string,
  patch: Partial<Pick<ItemState, "read" | "saved" | "skipped" | "liked">>
): Promise<ItemState | null> {
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemId: item.id,
        briefingDate,
        patch,
        itemSnapshot: patch.saved === true ? item : undefined
      })
    });

    if (!response.ok) return null;
    const value = (await response.json()) as { state?: ItemState };
    return value.state ?? null;
  } catch {
    return null;
  }
}

export async function recordEvent(
  itemId: string,
  briefingDate: string,
  eventType: "shown" | "opened",
  metadata?: unknown
) {
  try {
    await fetch("/api/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemId,
        briefingDate,
        eventType,
        metadata
      })
    });
  } catch {
    // Exposure telemetry is best-effort.
  }
}

export async function reconcileRemoteState(
  localStates: ItemStateMap,
  localSavedItems: SavedItemMap,
  feedItems: FeedItem[]
) {
  const remote = await loadRemoteStateBundle();
  if (!remote) {
    return {
      states: localStates,
      savedItems: localSavedItems,
      syncAvailable: false
    };
  }

  const mergedStates = mergeStateMaps(localStates, remote.states);
  const mergedSavedItems = mergeSavedItems(localSavedItems, remote.savedItems);
  const localNewer = findLocalNewerStates(localStates, remote.states);
  const itemLookup = new Map<string, FeedItem>([
    ...feedItems.map((item) => [item.id, item] as const),
    ...Object.entries(localSavedItems)
  ]);

  if (remote.writeEnabled) {
    await Promise.all(
      Object.entries(localNewer).map(async ([itemId, state]) => {
        const item = itemLookup.get(itemId);
        if (!item) return;

        await syncState(item, item.briefingDate, {
          read: state.read,
          saved: state.saved,
          skipped: state.skipped,
          liked: state.liked
        });
      })
    );
  }

  return {
    states: mergedStates,
    savedItems: mergedSavedItems,
    syncAvailable: remote.writeEnabled
  };
}

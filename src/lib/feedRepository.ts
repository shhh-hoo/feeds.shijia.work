import { fallbackFeed } from "../data/fallbackFeed";
import type { DailyFeedSnapshot, ItemState, ItemStateMap } from "../types";

const CLIENT_ID_KEY = "feeds.shijia.work:client-id:v1";

export function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

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

export async function loadRemoteStates(): Promise<ItemStateMap | null> {
  try {
    const clientId = getClientId();
    const response = await fetch("/api/state?clientId=" + encodeURIComponent(clientId), {
      headers: { accept: "application/json" }
    });
    if (!response.ok) return null;
    const value = (await response.json()) as { states?: ItemStateMap };
    return value.states ?? null;
  } catch {
    return null;
  }
}

export async function syncState(
  itemId: string,
  briefingDate: string,
  patch: Partial<Pick<ItemState, "saved" | "consumed" | "skipped" | "liked">>
) {
  try {
    await fetch("/api/state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientId: getClientId(),
        itemId,
        briefingDate,
        patch
      })
    });
  } catch {
    // Local state remains authoritative when remote sync is unavailable.
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
        clientId: getClientId(),
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

export function mergeStates(local: ItemStateMap, remote: ItemStateMap): ItemStateMap {
  const merged = { ...local };
  for (const [id, state] of Object.entries(remote)) {
    const current = merged[id];
    if (!current || state.updatedAt > current.updatedAt) {
      merged[id] = state;
    }
  }
  return merged;
}

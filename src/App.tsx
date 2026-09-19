import { useEffect, useMemo, useRef, useState } from "react";
import { fallbackFeed } from "./data/fallbackFeed";
import {
  loadFeed,
  reconcileRemoteState,
  recordEvent,
  syncState
} from "./lib/feedRepository";
import {
  mergeItemState,
  readItemStates,
  readSavedItems,
  setSavedItem,
  writeItemStates,
  writeSavedItems
} from "./lib/storage";
import type {
  ContentBlock,
  DailyFeedSnapshot,
  FeedItem,
  ItemState,
  ItemStateMap,
  SavedItemMap
} from "./types";

type View = "today" | "saved" | "archive";
type StateKey = "read" | "saved" | "skipped" | "liked";
type SyncStatus = "connecting" | "synced" | "local";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
    .format(new Date(value + "T12:00:00"))
    .toUpperCase();
}

function Block({ block }: { block: ContentBlock }) {
  if (block.type === "metric") {
    return (
      <div className="card-block metric">
        <strong>{block.value}</strong>
        <span>{block.label}</span>
        {block.note ? <small>{block.note}</small> : null}
      </div>
    );
  }

  const className = "card-block " + block.type;
  const prefix = block.type === "bullet" ? "• " : block.type === "watch-for" ? "→ " : "";
  return <p className={className}>{prefix + block.text}</p>;
}

function Card({
  item,
  state,
  onToggle,
  onOpen
}: {
  item: FeedItem;
  state?: ItemState;
  onToggle: (key: StateKey) => void;
  onOpen: () => void;
}) {
  const primarySource = item.sources[0];

  return (
    <article
      className={
        "card span-" +
        (item.span ?? 1) +
        (state?.skipped ? " is-skipped" : "") +
        (state?.read ? " is-read" : "")
      }
      data-kind={item.kind}
    >
      {item.media ? (
        <img className="card-media" src={item.media.url} alt={item.media.alt} loading="lazy" />
      ) : null}

      <div className="card-content">
        {item.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>

      <div className="card-footer">
        <div className="card-index">
          <strong>{item.title}</strong>
          <span>
            {[
              ...item.tags.slice(0, 3).map((tag) => tag.toUpperCase()),
              item.minutes ? item.minutes + " MIN" : ""
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>

        <div className="card-actions" aria-label={"Actions for " + item.title}>
          <button
            className={state?.read ? "active" : ""}
            onClick={() => onToggle("read")}
            aria-label={state?.read ? "Mark unread" : "Mark read"}
            title={state?.read ? "Mark unread" : "Mark read"}
          >
            {state?.read ? "✓" : "○"}
          </button>
          <button
            className={state?.saved ? "active" : ""}
            onClick={() => onToggle("saved")}
            aria-label={state?.saved ? "Remove from saved" : "Save"}
            title={state?.saved ? "Remove from saved" : "Save"}
          >
            {state?.saved ? "★" : "☆"}
          </button>
          <button
            className={state?.liked ? "active" : ""}
            onClick={() => onToggle("liked")}
            aria-label="Like"
            title="Like"
          >
            {state?.liked ? "♥" : "♡"}
          </button>
          <button
            className={state?.skipped ? "active" : ""}
            onClick={() => onToggle("skipped")}
            aria-label="Skip"
            title="Skip"
          >
            ×
          </button>
        </div>
      </div>

      {primarySource ? (
        <a
          className="card-link"
          href={primarySource.url}
          target="_blank"
          rel="noreferrer"
          onClick={onOpen}
        >
          {primarySource.name} ↗
        </a>
      ) : null}
    </article>
  );
}

export default function App() {
  const [view, setView] = useState<View>("today");
  const [feed, setFeed] = useState<DailyFeedSnapshot>(fallbackFeed);
  const [states, setStates] = useState<ItemStateMap>(() => readItemStates());
  const [savedItems, setSavedItems] = useState<SavedItemMap>(() => readSavedItems());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("connecting");
  const shown = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const remoteFeed = await loadFeed(fallbackFeed.date);
      if (cancelled) return;
      setFeed(remoteFeed);

      const result = await reconcileRemoteState(
        readItemStates(),
        readSavedItems(),
        remoteFeed.items
      );
      if (cancelled) return;

      setStates(result.states);
      setSavedItems(result.savedItems);
      writeItemStates(result.states);
      writeSavedItems(result.savedItems);
      setSyncStatus(result.syncAvailable ? "synced" : "local");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    for (const item of feed.items) {
      if (shown.current.has(item.id)) continue;
      shown.current.add(item.id);
      void recordEvent(item.id, feed.date, "shown");
    }
  }, [feed]);

  const items = useMemo(() => {
    if (view === "saved") {
      const lookup = new Map<string, FeedItem>();
      for (const item of Object.values(savedItems)) lookup.set(item.id, item);
      for (const item of feed.items) lookup.set(item.id, item);

      return [...lookup.values()]
        .filter((item) => states[item.id]?.saved)
        .sort((a, b) => b.briefingDate.localeCompare(a.briefingDate));
    }

    if (view === "archive") {
      return [...feed.items].sort((a, b) =>
        (b.publishedAt ?? b.discoveredAt).localeCompare(a.publishedAt ?? a.discoveredAt)
      );
    }

    return feed.items.filter((item) => !states[item.id]?.skipped);
  }, [feed, savedItems, states, view]);

  function toggle(item: FeedItem, key: StateKey) {
    const value = !states[item.id]?.[key];

    setStates((current) => {
      const next = mergeItemState(current, item.id, key, value);
      writeItemStates(next);
      return next;
    });

    if (key === "saved") {
      setSavedItems((current) => {
        const next = setSavedItem(current, item, value);
        writeSavedItems(next);
        return next;
      });
    }

    void (async () => {
      const serverState = await syncState(item, item.briefingDate, { [key]: value });
      if (!serverState) {
        setSyncStatus("local");
        return;
      }

      setStates((current) => {
        const next = { ...current, [item.id]: serverState };
        writeItemStates(next);
        return next;
      });
      setSyncStatus("synced");
    })();
  }

  return (
    <main className="shell">
      <header className="topline">
        <div className="topline-status">
          <time dateTime={feed.date}>{formatDate(feed.date)}</time>
          <span className={"sync-status " + syncStatus} title="Reading-state sync status">
            {syncStatus === "synced" ? "SYNCED" : syncStatus === "connecting" ? "SYNC…" : "LOCAL"}
          </span>
        </div>

        <nav aria-label="Feed views">
          {(["today", "saved", "archive"] as View[]).map((key) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={view === key ? "active" : ""}
            >
              {key}
            </button>
          ))}
        </nav>
      </header>

      <section className="feed" aria-live="polite">
        {items.length ? (
          items.map((item) => (
            <Card
              key={item.id}
              item={item}
              state={states[item.id]}
              onToggle={(key) => toggle(item, key)}
              onOpen={() => void recordEvent(item.id, feed.date, "opened")}
            />
          ))
        ) : (
          <div className="empty">Nothing here yet.</div>
        )}
      </section>
    </main>
  );
}

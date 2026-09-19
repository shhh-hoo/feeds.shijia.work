import { useEffect, useMemo, useRef, useState } from "react";
import { fallbackFeed } from "./data/fallbackFeed";
import {
  loadFeed,
  loadRemoteStates,
  mergeStates,
  recordEvent,
  syncState
} from "./lib/feedRepository";
import { mergeItemState, readItemStates, writeItemStates } from "./lib/storage";
import type {
  ContentBlock,
  DailyFeedSnapshot,
  FeedItem,
  ItemState,
  ItemStateMap
} from "./types";

type View = "today" | "saved" | "archive";
type StateKey = "saved" | "consumed" | "skipped" | "liked";

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
      className={"card span-" + (item.span ?? 1) + (state?.skipped ? " is-skipped" : "")}
      data-kind={item.kind}
    >
      {item.media ? (
        <img
          className="card-media"
          src={item.media.url}
          alt={item.media.alt}
          loading="lazy"
        />
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
            className={state?.saved ? "active" : ""}
            onClick={() => onToggle("saved")}
            aria-label="Save"
            title="Save"
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
            className={state?.consed ? "active" : ""}
            onClick={() => onToggle("consumed")}
            aria-label="Mark consumed"
            title="Consumed"
          >
            {state?.consumed ? "●" : "○"}
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
  const shown = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [remoteFeed, remoteStates] = await Promise.all([
        loadFeed(fallbackFeed.date),
        loadRemoteStates()
      ]);

      if (cancelled) return;
      setFeed(remoteFeed);

      if (remoteStates) {
        setStates((current) => {
          const next = mergeStates(current, remoteStates);
          writeItemStates(next);
          return next;
        });
      }
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
      return feed.items.filter((item) => states[item.id]?.saved);
    }

    if (view === "archive") {
      return [...feed.items].sort((a, b) =>
        (b.publishedAt ?? b.discoveredAt).localeCompare(a.publishedAt ?? a.discoveredAt)
      );
    }

    return feed.items.filter((item) => !states[item.id]?.skipped);
  }, [feed, states, view]);

  function toggle(item: FeedItem, key: StateKey) {
    const value = !states[item.id]?.[key];

    setStates((current) => {
      const next = mergeItemState(current, item.id, key, value);
      writeItemStates(next);
      return next;
    });

    void syncState(item.id, feed.date, { [key]: value });
  }

  return (
    <main className="shell">
      <header className="topline">
        <time dateTime={feed.date}>{formatDate(feed.date)}</time>
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

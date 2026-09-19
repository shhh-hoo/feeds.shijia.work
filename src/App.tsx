import { useMemo, useState } from "react";
import { seedItems } from "./data/seed";
import { mergeItemState, readItemStates, writeItemStates } from "./lib/storage";
import type { FeedItem, ItemStateMap } from "./types";

type View = "today" | "saved" | "archive";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
    .format(new Date(value + "T12:00:00"))
    .toUpperCase();
}

function Card({
  item,
  state,
  onToggle
}: {
  item: FeedItem;
  state: ItemStateMap[string];
  onToggle: (key: "saved" | "consumed" | "skipped" | "liked") => void;
}) {
  return (
    <article
      className={"card span-" + (item.span ?? 1) + (state?.skipped ? " is-skipped" : "")}
      data-kind={item.kind}
    >
      {item.imageUrl ? (
        <img className="card-media" src={item.imageUrl} alt="" loading="lazy" />
      ) : null}

      <div className="card-content">
        <ul>
          {item.content.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="card-footer">
        <div className="card-index">
          <strong>{item.title}</strong>
          <span>
            {[...(item.meta ?? []), item.minutes ? item.minutes + " MIN" : ""]
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
            className={state?.consumed ? "active" : ""}
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

      {item.sourceUrl ? (
        <a className="card-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
          {item.source ?? "Source"} ↗
        </a>
      ) : null}
    </article>
  );
}

export default function App() {
  const [view, setView] = useState<View>("today");
  const [states, setStates] = useState<ItemStateMap>(() => readItemStates());

  const items = useMemo(() => {
    if (view === "saved") {
      return seedItems.filter((item) => states[item.id]?.saved);
    }

    if (view === "archive") {
      return [...seedItems].sort((a, b) => b.date.localeCompare(a.date));
    }

    const today = seedItems[0]?.date;
    return seedItems.filter(
      (item) => item.date === today && !states[item.id]?.skipped
    );
  }, [states, view]);

  function toggle(item: FeedItem, key: "saved" | "consumed" | "skipped" | "liked") {
    setStates((current) => {
      const next = mergeItemState(current, item.id, {
        [key]: !current[item.id]?.[key]
      });
      writeItemStates(next);
      return next;
    });
  }

  const activeDate = seedItems[0]?.date ?? new Date().toISOString().slice(0, 10);

  return (
    <main className="shell">
      <header className="topline">
        <time dateTime={activeDate}>{formatDate(activeDate)}</time>
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
            />
          ))
        ) : (
          <div className="empty">Nothing here yet.</div>
        )}
      </section>
    </main>
  );
}

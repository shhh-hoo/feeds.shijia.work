import type {
  DailyFeedSnapshot,
  DailyIssueV2,
  FeedItem,
  FeedKind,
  Freshness,
  InterestId,
  IssueItem,
  SourceRef
} from "../types";

const INTEREST_IDS = new Set<InterestId>([
  "current-signals",
  "career-product",
  "agent-software",
  "learning-education",
  "design",
  "screen-sound",
  "literature-ideas",
  "internet-self-media",
  "queer-culture",
  "cross-border-commerce",
  "fashion-apparel"
]);

function firstInterest(item: IssueItem): InterestId {
  const interest = item.metadata?.interests?.find((candidate): candidate is InterestId =>
    INTEREST_IDS.has(candidate as InterestId)
  );
  return interest ?? "current-signals";
}

function legacyKind(item: IssueItem): FeedKind {
  if (item.presentation.mode === "listening") return "music";
  if (item.presentation.mode === "viewing") return "film";
  if (item.presentation.mode === "object") {
    return item.metadata?.interests?.includes("fashion-apparel") ? "fashion" : "design";
  }
  if (item.presentation.mode === "reading" && item.metadata?.interests?.includes("literature-ideas")) {
    return "literature";
  }

  const interest = firstInterest(item);
  if (interest === "agent-software") return "software";
  if (interest === "learning-education") return "learning";
  if (interest === "design") return "design";
  if (interest === "screen-sound") return "film";
  if (interest === "literature-ideas") return "literature";
  if (interest === "internet-self-media") return "internet";
  if (interest === "queer-culture") return "queer";
  if (interest === "cross-border-commerce") return "commerce";
  if (interest === "fashion-apparel") return "fashion";
  if (interest === "career-product") return "career";
  return "signal";
}

function legacyFreshness(mode: "current" | "expansion"): Freshness {
  return mode === "current" ? "recent" : "archive";
}

function legacySources(item: IssueItem): SourceRef[] {
  return item.provenance.sources.map((source) => ({
    sourceId: source.id,
    name: source.name,
    url: source.url,
    role:
      source.role === "verification"
        ? "verification"
        : source.role === "availability"
          ? "availability"
          : source.role === "context"
            ? "discussion"
            : "primary",
    publishedAt: source.publishedAt
  }));
}

function toLegacyItem(issue: DailyIssueV2, item: IssueItem, mode: "current" | "expansion"): FeedItem {
  const blocks: FeedItem["blocks"] = [];
  if (item.editorial.lede) blocks.push({ type: "text", text: item.editorial.lede });
  for (const paragraph of item.editorial.body ?? []) blocks.push({ type: "text", text: paragraph });
  if (item.editorial.entryPoint) blocks.push({ type: "watch-for", text: item.editorial.entryPoint });
  for (const fact of item.editorial.structured ?? []) {
    blocks.push({ type: "metric", label: fact.label, value: fact.value });
  }

  const firstMedia = item.presentation.media?.[0];
  const firstDatedSource = item.provenance.sources.find((source) => source.publishedAt);

  return {
    id: item.id,
    briefingDate: issue.date,
    kind: legacyKind(item),
    interestId: firstInterest(item),
    title: item.editorial.title,
    blocks,
    sources: legacySources(item),
    selectionReason: item.editorial.why,
    creator: item.editorial.creator,
    publishedAt: firstDatedSource?.publishedAt,
    discoveredAt: item.metadata?.discoveredAt ?? issue.generatedAt,
    language: item.metadata?.language,
    region: item.metadata?.region,
    freshness: legacyFreshness(mode),
    reliability: "primary",
    minutes: item.metadata?.estimatedMinutes,
    tags: item.metadata?.tags ?? [],
    media: firstMedia
      ? {
          type:
            firstMedia.kind === "cover"
              ? "album-cover"
              : firstMedia.kind === "poster"
                ? "poster"
                : firstMedia.kind === "still"
                  ? "still"
                  : "image",
          url: firstMedia.url,
          alt: firstMedia.alt,
          credit: firstMedia.credit
        }
      : undefined
  };
}

export function issueToLegacyFeed(issue: DailyIssueV2): DailyFeedSnapshot {
  const items = issue.contents.flatMap((section) =>
    section.items.map((item) => toLegacyItem(issue, item, section.mode))
  );

  return {
    version: 1,
    date: issue.date,
    timezone: issue.timezone,
    generatedAt: issue.generatedAt,
    items
  };
}

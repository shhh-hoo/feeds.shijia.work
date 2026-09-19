export type FeedKind =
  | "signal"
  | "career"
  | "software"
  | "learning"
  | "design"
  | "music"
  | "film"
  | "series"
  | "literature"
  | "internet"
  | "queer"
  | "commerce"
  | "fashion"
  | "wildcard";

export type InterestId =
  | "current-signals"
  | "career-product"
  | "agent-software"
  | "learning-education"
  | "design"
  | "screen-sound"
  | "literature-ideas"
  | "internet-self-media"
  | "queer-culture"
  | "cross-border-commerce"
  | "fashion-apparel";

export type Freshness = "new" | "recent" | "archive" | "evergreen";
export type Reliability = "primary" | "verified-secondary" | "specialist" | "community-signal";
export type ConsumptionMode =
  | "skim"
  | "deep-read"
  | "focused-watch"
  | "walking-listen"
  | "save-for-later"
  | "weekend";

export type ContentBlock =
  | { type: "bullet"; text: string }
  | { type: "text"; text: string }
  | { type: "note"; text: string }
  | { type: "watch-for"; text: string }
  | { type: "metric"; label: string; value: string; note?: string };

export type SourceRef = {
  sourceId: string;
  name: string;
  url: string;
  role: "primary" | "verification" | "discussion" | "availability";
  publishedAt?: string;
  dateLabel?: string;
};

export type MediaRef = {
  type: "image" | "album-cover" | "poster" | "still";
  url: string;
  alt: string;
  credit?: string;
  aspectRatio?: string;
};

export type ItemScores = {
  quality: number;
  interest: number;
  novelty: number;
  sourceQuality: number;
  diversity: number;
  final: number;
};

export type FeedItem = {
  id: string;
  briefingDate: string;
  kind: FeedKind;
  interestId: InterestId;
  title: string;
  blocks: ContentBlock[];
  sources: SourceRef[];
  selectionReason: string;
  creator?: string;
  publishedAt?: string;
  discoveredAt: string;
  language?: string;
  region?: string;
  freshness: Freshness;
  reliability: Reliability;
  minutes?: number;
  consumptionMode?: ConsumptionMode;
  span?: 1 | 2 | 3;
  tags: string[];
  media?: MediaRef;
  scores?: ItemScores;
};

export type DailyFeedSnapshot = {
  version: 1;
  date: string;
  timezone: string;
  generatedAt: string;
  items: FeedItem[];
};

export type ItemState = {
  read?: boolean;
  saved?: boolean;
  skipped?: boolean;
  liked?: boolean;
  updatedAt: string;
};

export type ItemStateMap = Record<string, ItemState>;
export type SavedItemMap = Record<string, FeedItem>;

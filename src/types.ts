export type EditorialMode = "current" | "expansion";

export type PresentationMode =
  | "dispatch"
  | "essay"
  | "object"
  | "listening"
  | "viewing"
  | "reading";

export type IssueSourceRole =
  | "primary"
  | "verification"
  | "context"
  | "availability"
  | "original";

export type IssueSourceRights = "public-domain" | "licensed" | "quoted" | "link-only";

export type IssueSource = {
  id: string;
  name: string;
  url: string;
  role: IssueSourceRole;
  publishedAt?: string;
  accessedAt?: string;
  rights?: IssueSourceRights;
};

export type ProvenanceAssertion = {
  kind: "fact" | "attributed-claim" | "editorial-inference" | "source-text";
  text: string;
  sourceRefs?: string[];
};

export type StructuredFact = {
  label: string;
  value: string;
  sourceRefs?: string[];
};

export type IssueEditorial = {
  title: string;
  why: string;
  creator?: string;
  lede?: string;
  body?: string[];
  entryPoint?: string;
  structured?: StructuredFact[];
};

export type IssueMedia = {
  kind?: "image" | "cover" | "poster" | "still";
  url: string;
  alt: string;
  credit?: string;
};

export type IssuePresentation = {
  mode: PresentationMode;
  media?: IssueMedia[];
};

export type IssueProvenance = {
  sources: IssueSource[];
  assertions?: ProvenanceAssertion[];
};

export type IssueItemMetadata = {
  interests?: string[];
  tags?: string[];
  language?: string;
  region?: string;
  discoveredAt?: string;
  estimatedMinutes?: number;
  relatedItemRefs?: string[];
};

export type IssueItem = {
  id: string;
  editorial: IssueEditorial;
  presentation: IssuePresentation;
  provenance: IssueProvenance;
  metadata?: IssueItemMetadata;
};

export type EditorialSection = {
  mode: EditorialMode;
  items: IssueItem[];
};

export type DailyIssueV2 = {
  schema: "feeds.daily-issue";
  version: 2;
  id: string;
  date: string;
  timezone: string;
  generatedAt: string;
  publishedAt: string;
  contents: EditorialSection[];
};

/*
 * Legacy reader/state types below are intentionally retained during convergence.
 * They are adapter/runtime shapes for the Phase 1 React reader and are not the
 * canonical published editorial schema. Phase 5 will move the reader to DailyIssueV2.
 */
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

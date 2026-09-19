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

export type FeedItem = {
  id: string;
  date: string;
  kind: FeedKind;
  title: string;
  content: string[];
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  creator?: string;
  meta?: string[];
  minutes?: number;
  span?: 1 | 2 | 3;
  freshness?: "new" | "recent" | "archive" | "evergreen";
};

export type ItemState = {
  saved?: boolean;
  consumed?: boolean;
  skipped?: boolean;
  liked?: boolean;
  updatedAt: string;
};

export type ItemStateMap = Record<string, ItemState>;

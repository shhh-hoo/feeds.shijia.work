import type { FeedItem } from "../types";

export const seedItems: FeedItem[] = [
  {
    id: "agent-boundaries",
    date: "2026-09-19",
    kind: "software",
    title: "Agent security is increasingly an infrastructure problem",
    content: [
      "Prompt rules are not network boundaries.",
      "Executable dependencies should be verified by resolved immutable identity, not only by declared version or SHA.",
      "The useful question is no longer only “what can the model decide?” but “what can the runtime actually mutate?”"
    ],
    meta: ["AGENT", "SECURITY", "CURRENT"],
    freshness: "new",
    span: 2
  },
  {
    id: "vertical-ai",
    date: "2026-09-19",
    kind: "signal",
    title: "Vertical AI is becoming a system, not a prompt",
    content: [
      "The recurring product stack is: authoritative corpus → retrieval → domain instructions → permissions → provenance → specialist tools.",
      "Model choice matters, but increasingly sits inside a larger workflow architecture."
    ],
    meta: ["AI PRODUCT", "SYSTEM"],
    freshness: "recent",
    span: 2
  },
  {
    id: "design-expansion",
    date: "2026-09-19",
    kind: "design",
    title: "Design expansion should not behave like design news",
    content: [
      "Look for composition, typography, interaction, visual systems, exhibition design and historical interfaces regardless of publication date.",
      "A useful design recommendation should say what to inspect, what can be borrowed, and what should not be copied."
    ],
    meta: ["DESIGN", "EXPANSION"],
    freshness: "evergreen",
    span: 1
  },
  {
    id: "screen-sound",
    date: "2026-09-19",
    kind: "music",
    title: "Screen & Sound is a first-class input stream",
    content: [
      "Music, film, TV, animation and documentary should be selected for taste and craft, not only because they are newly released.",
      "Media cards should expose why the work is worth attention, what to listen/watch for, and the realistic commitment required."
    ],
    meta: ["MUSIC", "FILM", "TV"],
    freshness: "evergreen",
    span: 1
  },
  {
    id: "fashion-commerce",
    date: "2026-09-19",
    kind: "fashion",
    title: "Fashion × cross-border commerce",
    content: [
      "Track product, silhouette, materials, campaign language, merchandising and retail—not only runway news.",
      "For cross-border brands, pair aesthetics with channel, pricing, logistics, content conversion and unit economics."
    ],
    meta: ["FASHION", "COMMERCE"],
    freshness: "evergreen",
    span: 1
  },
  {
    id: "learning",
    date: "2026-09-19",
    kind: "learning",
    title: "Learning systems deserve their own search budget",
    content: [
      "Prioritize transfer, representation, feedback, assessment and teacher–AI collaboration over generic edtech announcements.",
      "Archive material is often more useful here than daily news."
    ],
    meta: ["LEARNING", "EDUCATION"],
    freshness: "evergreen",
    span: 1
  },
  {
    id: "wildcard",
    date: "2026-09-19",
    kind: "wildcard",
    title: "Keep a wildcard slot",
    content: [
      "A recommendation system that only optimizes existing interests eventually narrows them.",
      "Reserve room for unfamiliar scenes, archives, disciplines, places and formats."
    ],
    meta: ["WILDCARD"],
    freshness: "archive",
    span: 1
  }
];

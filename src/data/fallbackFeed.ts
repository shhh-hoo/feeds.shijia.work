import issue from "../../content/issues/2026-09-19.json";
import type { DailyIssueV2 } from "../types";
import { issueToLegacyFeed } from "./issueAdapter";

export const fallbackFeed = issueToLegacyFeed(issue as DailyIssueV2);

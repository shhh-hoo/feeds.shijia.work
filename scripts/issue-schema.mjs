export const ISSUE_SCHEMA_ID = "feeds.daily-issue";
export const ISSUE_SCHEMA_VERSION = 2;
export const EDITORIAL_MODES = ["current", "expansion"];
export const PRESENTATION_MODES = [
  "dispatch",
  "essay",
  "object",
  "listening",
  "viewing",
  "reading"
];
export const SOURCE_ROLES = ["primary", "verification", "context", "availability", "original"];
export const ASSERTION_KINDS = ["fact", "attributed-claim", "editorial-inference", "source-text"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISSUE_ID_RE = /^issue-\d{4}-\d{2}-\d{2}$/;
const RIGHTS = new Set(["public-domain", "licensed", "quoted", "link-only"]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isCalendarDate(value) {
  if (!isNonEmptyString(value) || !DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isIsoTimestamp(value) {
  if (!isNonEmptyString(value)) return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

function isTimeZone(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function isHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function localDateForTimestamp(timestamp, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(timestamp))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function pathOf(base, part) {
  return typeof part === "number" ? `${base}[${part}]` : base ? `${base}.${part}` : part;
}

function checkStringArray(value, at, errors, { allowEmpty = true, slug = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${at}: must be an array`);
    return;
  }
  if (!allowEmpty && value.length === 0) errors.push(`${at}: must be non-empty`);
  const seen = new Set();
  value.forEach((entry, index) => {
    const entryAt = pathOf(at, index);
    if (!isNonEmptyString(entry)) {
      errors.push(`${entryAt}: must be a non-empty string`);
      return;
    }
    if (slug && !SLUG_RE.test(entry)) errors.push(`${entryAt}: must be a lowercase slug`);
    if (seen.has(entry)) errors.push(`${entryAt}: duplicate value ${entry}`);
    seen.add(entry);
  });
}

function validateSource(source, at, errors, issueDate) {
  if (!isRecord(source)) {
    errors.push(`${at}: must be an object`);
    return;
  }
  if (!isNonEmptyString(source.id) || !SLUG_RE.test(source.id)) {
    errors.push(`${at}.id: must be a lowercase slug`);
  }
  if (!isNonEmptyString(source.name)) errors.push(`${at}.name: must be a non-empty string`);
  if (!isHttpUrl(source.url)) errors.push(`${at}.url: must be an absolute http(s) URL`);
  if (!SOURCE_ROLES.includes(source.role)) {
    errors.push(`${at}.role: unsupported source role ${String(source.role)}`);
  }
  if (source.publishedAt != null) {
    if (!isCalendarDate(source.publishedAt)) {
      errors.push(`${at}.publishedAt: must be YYYY-MM-DD`);
    } else if (isCalendarDate(issueDate) && source.publishedAt > issueDate) {
      errors.push(`${at}.publishedAt: cannot be after Issue date ${issueDate}`);
    }
  }
  if (source.accessedAt != null && !isIsoTimestamp(source.accessedAt)) {
    errors.push(`${at}.accessedAt: must be an ISO 8601 timestamp with timezone`);
  }
  if (source.rights != null && !RIGHTS.has(source.rights)) {
    errors.push(`${at}.rights: unsupported rights value ${String(source.rights)}`);
  }
}

function validateSourceRefs(refs, at, errors, sourceIds, { required = false } = {}) {
  if (refs == null) {
    if (required) errors.push(`${at}: sourceRefs are required`);
    return;
  }
  if (!Array.isArray(refs) || (required && refs.length === 0)) {
    errors.push(`${at}: sourceRefs must be ${required ? "a non-empty " : "an "}array`);
    return;
  }
  const seen = new Set();
  refs.forEach((ref, index) => {
    if (!isNonEmptyString(ref) || !SLUG_RE.test(ref)) {
      errors.push(`${at}[${index}]: must be a source id slug`);
      return;
    }
    if (!sourceIds.has(ref)) errors.push(`${at}[${index}]: unknown source reference ${ref}`);
    if (seen.has(ref)) errors.push(`${at}[${index}]: duplicate source reference ${ref}`);
    seen.add(ref);
  });
}

function validateItem(item, at, errors, issueDate, mode, allItems) {
  if (!isRecord(item)) {
    errors.push(`${at}: must be an object`);
    return;
  }

  if (!isNonEmptyString(item.id) || !SLUG_RE.test(item.id)) {
    errors.push(`${at}.id: must be a lowercase slug`);
  } else if (allItems.has(item.id)) {
    errors.push(`${at}.id: duplicate Item id ${item.id}`);
  } else {
    allItems.set(item.id, { item, at, mode });
  }

  if (!isRecord(item.editorial)) {
    errors.push(`${at}.editorial: must be an object`);
  } else {
    const editorial = item.editorial;
    if (!isNonEmptyString(editorial.title)) errors.push(`${at}.editorial.title: must be non-empty`);
    if (!isNonEmptyString(editorial.why)) errors.push(`${at}.editorial.why: must be non-empty`);

    if (editorial.lede != null && !isNonEmptyString(editorial.lede)) {
      errors.push(`${at}.editorial.lede: must be a non-empty string when present`);
    }
    if (editorial.entryPoint != null && !isNonEmptyString(editorial.entryPoint)) {
      errors.push(`${at}.editorial.entryPoint: must be a non-empty string when present`);
    }
    if (editorial.creator != null && !isNonEmptyString(editorial.creator)) {
      errors.push(`${at}.editorial.creator: must be a non-empty string when present`);
    }

    if (editorial.body != null) {
      if (!Array.isArray(editorial.body)) {
        errors.push(`${at}.editorial.body: must be an array of paragraphs`);
      } else {
        editorial.body.forEach((paragraph, index) => {
          if (!isNonEmptyString(paragraph)) {
            errors.push(`${at}.editorial.body[${index}]: paragraph must be non-empty`);
          }
        });
      }
    }

    if (editorial.structured != null && !Array.isArray(editorial.structured)) {
      errors.push(`${at}.editorial.structured: must be an array`);
    }

    const hasPublishableContent =
      isNonEmptyString(editorial.lede) ||
      isNonEmptyString(editorial.entryPoint) ||
      (Array.isArray(editorial.body) && editorial.body.some(isNonEmptyString)) ||
      (Array.isArray(editorial.structured) && editorial.structured.length > 0);
    if (!hasPublishableContent) {
      errors.push(`${at}.editorial: Item has no publishable content beyond title/rationale`);
    }
  }

  if (!isRecord(item.presentation)) {
    errors.push(`${at}.presentation: must be an object`);
  } else {
    if (!PRESENTATION_MODES.includes(item.presentation.mode)) {
      errors.push(`${at}.presentation.mode: unsupported presentation mode ${String(item.presentation.mode)}`);
    }
    if (item.presentation.media != null) {
      if (!Array.isArray(item.presentation.media)) {
        errors.push(`${at}.presentation.media: must be an array`);
      } else {
        item.presentation.media.forEach((media, index) => {
          const mediaAt = `${at}.presentation.media[${index}]`;
          if (!isRecord(media)) {
            errors.push(`${mediaAt}: must be an object`);
            return;
          }
          if (!isHttpUrl(media.url)) errors.push(`${mediaAt}.url: must be an absolute http(s) URL`);
          if (!isNonEmptyString(media.alt)) errors.push(`${mediaAt}.alt: must be non-empty`);
          if (media.credit != null && !isNonEmptyString(media.credit)) {
            errors.push(`${mediaAt}.credit: must be non-empty when present`);
          }
          if (media.kind != null && !["image", "cover", "poster", "still"].includes(media.kind)) {
            errors.push(`${mediaAt}.kind: unsupported media kind ${String(media.kind)}`);
          }
        });
      }
    }
  }

  if (!isRecord(item.provenance)) {
    errors.push(`${at}.provenance: must be an object`);
    return;
  }

  const sources = item.provenance.sources;
  if (!Array.isArray(sources)) {
    errors.push(`${at}.provenance.sources: must be an array`);
    return;
  }

  const sourceIds = new Set();
  let datedCurrentSourceCount = 0;
  sources.forEach((source, index) => {
    const sourceAt = `${at}.provenance.sources[${index}]`;
    validateSource(source, sourceAt, errors, issueDate);
    if (isRecord(source) && isNonEmptyString(source.id)) {
      if (sourceIds.has(source.id)) errors.push(`${sourceAt}.id: duplicate source id ${source.id}`);
      sourceIds.add(source.id);
    }
    if (mode === "current" && isRecord(source) && isCalendarDate(source.publishedAt)) {
      datedCurrentSourceCount += 1;
    }
  });

  if (mode === "current" && datedCurrentSourceCount === 0) {
    errors.push(`${at}.provenance.sources: Current Item requires at least one dated source for date verification`);
  }

  if (Array.isArray(item.editorial?.structured)) {
    item.editorial.structured.forEach((entry, index) => {
      const entryAt = `${at}.editorial.structured[${index}]`;
      if (!isRecord(entry)) {
        errors.push(`${entryAt}: must be an object`);
        return;
      }
      if (!isNonEmptyString(entry.label)) errors.push(`${entryAt}.label: must be non-empty`);
      if (!isNonEmptyString(entry.value)) errors.push(`${entryAt}.value: must be non-empty`);
      validateSourceRefs(entry.sourceRefs, `${entryAt}.sourceRefs`, errors, sourceIds);
    });
  }

  const assertions = item.provenance.assertions;
  if (assertions != null) {
    if (!Array.isArray(assertions)) {
      errors.push(`${at}.provenance.assertions: must be an array`);
    } else {
      assertions.forEach((assertion, index) => {
        const assertionAt = `${at}.provenance.assertions[${index}]`;
        if (!isRecord(assertion)) {
          errors.push(`${assertionAt}: must be an object`);
          return;
        }
        if (!ASSERTION_KINDS.includes(assertion.kind)) {
          errors.push(`${assertionAt}.kind: unsupported assertion kind ${String(assertion.kind)}`);
        }
        if (!isNonEmptyString(assertion.text)) errors.push(`${assertionAt}.text: must be non-empty`);
        const requiresSources = ["fact", "attributed-claim", "source-text"].includes(assertion.kind);
        validateSourceRefs(assertion.sourceRefs, `${assertionAt}.sourceRefs`, errors, sourceIds, {
          required: requiresSources
        });
        if (assertion.kind === "source-text" && Array.isArray(assertion.sourceRefs)) {
          for (const ref of assertion.sourceRefs) {
            const source = sources.find((candidate) => candidate?.id === ref);
            if (source && source.role !== "original") {
              errors.push(`${assertionAt}.sourceRefs: source-text must reference source role original (${ref})`);
            }
          }
        }
      });
    }
  }

  if (item.metadata != null) {
    if (!isRecord(item.metadata)) {
      errors.push(`${at}.metadata: must be an object when present`);
    } else {
      if (item.metadata.interests != null) checkStringArray(item.metadata.interests, `${at}.metadata.interests`, errors, { slug: true });
      if (item.metadata.tags != null) checkStringArray(item.metadata.tags, `${at}.metadata.tags`, errors, { slug: true });
      if (item.metadata.discoveredAt != null && !isIsoTimestamp(item.metadata.discoveredAt)) {
        errors.push(`${at}.metadata.discoveredAt: must be an ISO 8601 timestamp with timezone`);
      }
      if (item.metadata.estimatedMinutes != null && (!Number.isInteger(item.metadata.estimatedMinutes) || item.metadata.estimatedMinutes <= 0)) {
        errors.push(`${at}.metadata.estimatedMinutes: must be a positive integer`);
      }
      if (item.metadata.relatedItemRefs != null) {
        checkStringArray(item.metadata.relatedItemRefs, `${at}.metadata.relatedItemRefs`, errors, { slug: true });
      }
    }
  }
}

export function validateIssue(issue) {
  const errors = [];
  if (!isRecord(issue)) return ["Issue: must be an object"];

  if (issue.schema !== ISSUE_SCHEMA_ID) {
    errors.push(`schema: must be ${ISSUE_SCHEMA_ID}`);
  }
  if (issue.version !== ISSUE_SCHEMA_VERSION) {
    errors.push(`version: must be ${ISSUE_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(issue.id) || !ISSUE_ID_RE.test(issue.id)) {
    errors.push("id: must match issue-YYYY-MM-DD");
  }
  if (!isCalendarDate(issue.date)) {
    errors.push("date: must be a real YYYY-MM-DD calendar date");
  }
  if (isCalendarDate(issue.date) && issue.id !== `issue-${issue.date}`) {
    errors.push(`id: must equal issue-${issue.date}`);
  }
  if (!isTimeZone(issue.timezone)) {
    errors.push("timezone: must be a valid IANA timezone");
  }
  if (!isIsoTimestamp(issue.generatedAt)) {
    errors.push("generatedAt: must be an ISO 8601 timestamp with timezone");
  }
  if (!isIsoTimestamp(issue.publishedAt)) {
    errors.push("publishedAt: must be an ISO 8601 timestamp with timezone");
  }
  if (isIsoTimestamp(issue.generatedAt) && isIsoTimestamp(issue.publishedAt)) {
    if (Date.parse(issue.generatedAt) > Date.parse(issue.publishedAt)) {
      errors.push("generatedAt: cannot be after publishedAt");
    }
  }
  if (isCalendarDate(issue.date) && isTimeZone(issue.timezone) && isIsoTimestamp(issue.publishedAt)) {
    if (localDateForTimestamp(issue.publishedAt, issue.timezone) !== issue.date) {
      errors.push("publishedAt: local publication date must equal Issue date in Issue timezone");
    }
  }

  if (!Array.isArray(issue.contents)) {
    errors.push("contents: must be an array of editorial mode sections");
    return errors;
  }
  if (issue.contents.length !== EDITORIAL_MODES.length) {
    errors.push(`contents: must contain exactly ${EDITORIAL_MODES.length} editorial mode sections`);
  }

  const seenModes = new Set();
  const allItems = new Map();
  issue.contents.forEach((section, sectionIndex) => {
    const at = `contents[${sectionIndex}]`;
    if (!isRecord(section)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    if (!EDITORIAL_MODES.includes(section.mode)) {
      errors.push(`${at}.mode: unsupported editorial mode ${String(section.mode)}`);
    } else if (seenModes.has(section.mode)) {
      errors.push(`${at}.mode: duplicate editorial mode ${section.mode}`);
    } else {
      seenModes.add(section.mode);
    }
    if (!Array.isArray(section.items)) {
      errors.push(`${at}.items: must be an array`);
      return;
    }
    section.items.forEach((item, itemIndex) => {
      validateItem(item, `${at}.items[${itemIndex}]`, errors, issue.date, section.mode, allItems);
    });
  });

  for (const mode of EDITORIAL_MODES) {
    if (!seenModes.has(mode)) errors.push(`contents: missing editorial mode ${mode}`);
  }

  for (const [itemId, { item, at }] of allItems.entries()) {
    const refs = item.metadata?.relatedItemRefs;
    if (!Array.isArray(refs)) continue;
    for (const ref of refs) {
      if (ref === itemId) errors.push(`${at}.metadata.relatedItemRefs: Item cannot reference itself (${ref})`);
      else if (!allItems.has(ref)) errors.push(`${at}.metadata.relatedItemRefs: unknown Item reference ${ref}`);
    }
  }

  return errors;
}

export function assertValidIssue(issue, label = "Issue") {
  const errors = validateIssue(issue);
  if (errors.length) {
    throw new Error(`${label} is invalid:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
  return issue;
}

import { describe, expect, it } from "vitest";
import { findLocalNewerStates, mergeSavedItems, mergeStateMaps } from "./stateSync";

describe("mergeStateMaps", () => {
  it("keeps the newest state per item", () => {
    const local = {
      a: { saved: true, updatedAt: "2026-09-19T10:00:00.000Z" },
      b: { read: true, updatedAt: "2026-09-19T12:00:00.000Z" }
    };
    const remote = {
      a: { saved: false, updatedAt: "2026-09-19T11:00:00.000Z" },
      b: { read: false, updatedAt: "2026-09-19T09:00:00.000Z" }
    };

    expect(mergeStateMaps(local, remote)).toEqual({
      a: remote.a,
      b: local.b
    });
  });

  it("identifies local states that still need upload", () => {
    const local = {
      a: { saved: true, updatedAt: "2026-09-19T12:00:00.000Z" },
      b: { read: true, updatedAt: "2026-09-19T08:00:00.000Z" }
    };
    const remote = {
      a: { saved: false, updatedAt: "2026-09-19T10:00:00.000Z" },
      b: { read: false, updatedAt: "2026-09-19T09:00:00.000Z" }
    };

    expect(findLocalNewerStates(local, remote)).toEqual({ a: local.a });
  });
});

describe("mergeSavedItems", () => {
  it("lets the remote snapshot fill historical saved items", () => {
    const local = { today: { id: "today" } as never };
    const remote = { yesterday: { id: "yesterday" } as never };

    expect(Object.keys(mergeSavedItems(local, remote)).sort()).toEqual([
      "today",
      "yesterday"
    ]);
  });
});

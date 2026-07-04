import { describe, expect, it } from "vitest";
import type { TimelineEntry } from "@multica/core/types";

import { sortTimelineEntriesAsc } from "./timeline-sort";

function entry(id: string, created_at: string): TimelineEntry {
  return {
    type: "activity",
    id,
    actor_type: "member",
    actor_id: "member-1",
    created_at,
  };
}

describe("sortTimelineEntriesAsc", () => {
  it("sorts timeline entries by created_at ascending", () => {
    const entries = [
      entry("later", "2026-01-01T00:00:02Z"),
      entry("earlier", "2026-01-01T00:00:01Z"),
      entry("latest", "2026-01-01T00:00:03Z"),
    ];

    expect(sortTimelineEntriesAsc(entries).map((e) => e.id)).toEqual([
      "earlier",
      "later",
      "latest",
    ]);
  });

  it("breaks identical created_at ties by id", () => {
    const entries = [
      entry("comment-b", "2026-01-01T00:00:01Z"),
      entry("comment-a", "2026-01-01T00:00:01Z"),
      entry("comment-c", "2026-01-01T00:00:01Z"),
    ];

    expect(sortTimelineEntriesAsc(entries).map((e) => e.id)).toEqual([
      "comment-a",
      "comment-b",
      "comment-c",
    ]);
  });

  it("returns the same array reference for cache patching callers", () => {
    const entries = [
      entry("b", "2026-01-01T00:00:02Z"),
      entry("a", "2026-01-01T00:00:01Z"),
    ];

    expect(sortTimelineEntriesAsc(entries)).toBe(entries);
  });
});

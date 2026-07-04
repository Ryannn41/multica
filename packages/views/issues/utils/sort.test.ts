import { describe, expect, it } from "vitest";
import type { Issue } from "@multica/core/types";

import { sortIssues } from "./sort";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-1",
    workspace_id: "ws-1",
    number: 1,
    identifier: "MUL-1",
    title: "Test issue",
    description: null,
    status: "todo",
    priority: "medium",
    assignee_type: null,
    assignee_id: null,
    creator_type: "member",
    creator_id: "member-1",
    parent_issue_id: null,
    project_id: null,
    position: 0,
    stage: null,
    start_date: null,
    due_date: null,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("sortIssues", () => {
  it("sorts by manual position without mutating the input array", () => {
    const issues = [
      makeIssue({ id: "second", position: 2 }),
      makeIssue({ id: "first", position: 1 }),
    ];

    const sorted = sortIssues(issues, "position", "asc");

    expect(sorted.map((issue) => issue.id)).toEqual(["first", "second"]);
    expect(issues.map((issue) => issue.id)).toEqual(["second", "first"]);
  });

  it("sorts priorities by configured rank", () => {
    const issues = [
      makeIssue({ id: "low", priority: "low" }),
      makeIssue({ id: "urgent", priority: "urgent" }),
      makeIssue({ id: "none", priority: "none" }),
      makeIssue({ id: "high", priority: "high" }),
    ];

    expect(sortIssues(issues, "priority", "asc").map((issue) => issue.id)).toEqual([
      "urgent",
      "high",
      "low",
      "none",
    ]);
  });

  it("keeps missing start dates after dated issues in ascending order", () => {
    const issues = [
      makeIssue({ id: "no-start", start_date: null }),
      makeIssue({ id: "later", start_date: "2026-01-03" }),
      makeIssue({ id: "earlier", start_date: "2026-01-01" }),
    ];

    expect(sortIssues(issues, "start_date", "asc").map((issue) => issue.id)).toEqual([
      "earlier",
      "later",
      "no-start",
    ]);
  });

  it("moves missing due dates to the front when descending reverses the ordered list", () => {
    const issues = [
      makeIssue({ id: "earlier", due_date: "2026-01-01" }),
      makeIssue({ id: "no-due", due_date: null }),
      makeIssue({ id: "later", due_date: "2026-01-03" }),
    ];

    expect(sortIssues(issues, "due_date", "desc").map((issue) => issue.id)).toEqual([
      "no-due",
      "later",
      "earlier",
    ]);
  });

  it("uses stable ordering when compared values are equal", () => {
    const issues = [
      makeIssue({ id: "first", title: "Same title" }),
      makeIssue({ id: "second", title: "Same title" }),
    ];

    expect(sortIssues(issues, "title", "asc").map((issue) => issue.id)).toEqual([
      "first",
      "second",
    ]);
  });
});

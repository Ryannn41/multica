// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  isRunTranscriptTaskId,
  RUN_TRANSCRIPT_PATHNAME,
  runTranscriptRoute,
} from "./run-transcript";

describe("run transcript route", () => {
  it("keeps the issue and task identifiers in the route", () => {
    expect(runTranscriptRoute("acme", "issue-7", "task-9")).toEqual({
      pathname: "/[workspace]/issue/[id]/run/[taskId]",
      params: {
        workspace: "acme",
        id: "issue-7",
        taskId: "task-9",
      },
    });
    expect(RUN_TRANSCRIPT_PATHNAME).toContain("[taskId]");
  });

  it("accepts only backend task UUIDs for transcript requests", () => {
    expect(
      isRunTranscriptTaskId("123e4567-e89b-12d3-a456-426614174000"),
    ).toBe(true);
    expect(isRunTranscriptTaskId("optimistic-task")).toBe(false);
    expect(isRunTranscriptTaskId(undefined)).toBe(false);
  });
});

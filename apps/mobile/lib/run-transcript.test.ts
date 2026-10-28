// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { TaskMessagePayload } from "@multica/core/types";
import { AgentTaskSchema } from "@/data/schemas";
import {
  buildRunTranscript,
  getRunDiagnostics,
  isCancellableRunStatus,
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

function message(seq: number, type: TaskMessagePayload["type"], content?: string): TaskMessagePayload {
  return { task_id: "task-1", issue_id: "issue-1", seq, type, content };
}

describe("historical run transcript", () => {
  it("sorts and joins streamed Markdown without changing the source messages", () => {
    const messages = [
      message(3, "text", "\n```"),
      message(1, "text", "```ts\n"),
      message(2, "text", "const answer = 42;"),
    ];
    const original = structuredClone(messages);

    expect(buildRunTranscript(messages)).toEqual([
      expect.objectContaining({ seq: 1, content: "```ts\nconst answer = 42;\n```" }),
    ]);
    expect(messages).toEqual(original);
  });

  it("merges adjacent thinking but keeps tool calls, results, and errors in order", () => {
    const messages = [
      message(1, "thinking", "First "),
      { ...message(2, "thinking", "check"), created_at: "2026-10-28T00:00:02Z" },
      { ...message(3, "tool_use"), tool: "Read", input: { file_path: "README.md" }, call_id: "read-1" },
      { ...message(4, "tool_result"), output: "contents", output_truncated: true, call_id: "read-1" },
      message(5, "thinking", "Then"),
      message(6, "error", "Failed"),
      message(7, "text", "Result"),
    ];

    expect(buildRunTranscript(messages)).toEqual([
      { ...messages[0], content: "First check", created_at: messages[1].created_at },
      ...messages.slice(2),
    ]);
    expect(buildRunTranscript([])).toEqual([]);
  });

  it("redacts secrets after joining fragments, including tool output", () => {
    const token = ["ghp_", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn"].join("");
    const result = buildRunTranscript([
      message(1, "text", token.slice(0, 12)),
      message(2, "text", token.slice(12)),
      { ...message(3, "tool_result"), output: `found ${token}` },
    ]);

    expect(result[0].content).toBe("[REDACTED GITHUB TOKEN]");
    expect(result[1].output).toBe("found [REDACTED GITHUB TOKEN]");
  });

  it("preserves startup diagnostics even when no execution messages exist", () => {
    const task = AgentTaskSchema.parse({
      id: "task-1", status: "failed", failure_reason: "environment_prepare_failed",
      error: "prepare execution environment: permission denied",
    });

    expect(buildRunTranscript([])).toEqual([]);
    expect(getRunDiagnostics(task)).toEqual({
      reasonKey: "failure_reason.environment_prepare_failed",
      error: "prepare execution environment: permission denied",
    });
  });

  it("redacts raw diagnostics and safely labels unknown failure reasons", () => {
    expect(getRunDiagnostics(AgentTaskSchema.parse({
      id: "task-1", status: "failed", failure_reason: "future_reason",
      error: "Authorization: Bearer fake-value",
    }))).toEqual({ reasonKey: "failure_reason.default", error: "Authorization: Bearer [REDACTED]" });
    expect(getRunDiagnostics(AgentTaskSchema.parse({ id: "task-1", status: "completed" }))).toBeNull();
  });
});

describe("run cancellation after schema parsing", () => {
  it.each(["queued", "deferred", "dispatched", "waiting_local_directory", "running"])(
    "keeps %s cancellable", (status) => {
      expect(isCancellableRunStatus(AgentTaskSchema.parse({ id: "task-1", status }).status)).toBe(true);
    },
  );
  it.each(["completed", "failed", "cancelled"])("does not cancel %s runs", (status) => {
    expect(isCancellableRunStatus(AgentTaskSchema.parse({ id: "task-1", status }).status)).toBe(false);
  });
});

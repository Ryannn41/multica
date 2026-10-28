const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const RUN_TRANSCRIPT_PATHNAME =
  "/[workspace]/issue/[id]/run/[taskId]" as const;

export function runTranscriptRoute(
  workspace: string,
  issueId: string,
  taskId: string,
) {
  return {
    pathname: RUN_TRANSCRIPT_PATHNAME,
    params: { workspace, id: issueId, taskId },
  } as const;
}

export function isRunTranscriptTaskId(taskId: unknown): taskId is string {
  return typeof taskId === "string" && UUID_PATTERN.test(taskId);
}

import { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AgentTask, TaskMessagePayload } from "@multica/core/types";
import { redactSecrets } from "@multica/core/security/redact-secrets";
import { Text } from "@/components/ui/text";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Markdown } from "@/lib/markdown";
import { useT } from "@/lib/i18n";
import { buildRunTranscript, getRunDiagnostics } from "@/lib/run-transcript";

const DISPLAY_CLIP_CHARS = 8_000;

export function RunTranscript({
  items,
  task,
  header,
}: {
  items: readonly TaskMessagePayload[];
  task: AgentTask;
  header: React.ReactElement;
}) {
  const { t } = useT("issues");
  const timeline = useMemo(() => buildRunTranscript(items), [items]);
  const diagnostics = getRunDiagnostics(task);

  return (
    <FlatList
      className="flex-1"
      contentContainerClassName="px-4 py-4"
      data={timeline}
      keyExtractor={(item, index) => `${item.task_id}-${item.seq}-${index}`}
      renderItem={({ item }) => <TranscriptEntry item={item} />}
      ItemSeparatorComponent={EntrySeparator}
      ListHeaderComponent={
        <View className="mb-4 gap-4">
          {header}
          {diagnostics ? (
            <View className="gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3">
              {diagnostics.reasonKey ? (
                <Text className="text-sm font-medium text-destructive">
                  {t(`chat:${diagnostics.reasonKey}`)}
                </Text>
              ) : null}
              {diagnostics.error ? (
                <View className="gap-1">
                  <Text className="text-xs font-medium text-muted-foreground">
                    {t("runs.transcript.diagnostics")}
                  </Text>
                  <Text selectable className="font-mono text-xs text-foreground">
                    {diagnostics.error}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        diagnostics ? null : (
          <View className="items-center rounded-lg border border-dashed border-border px-4 py-8">
            <Text className="text-sm text-muted-foreground">
              {t("runs.transcript.empty")}
            </Text>
          </View>
        )
      }
    />
  );
}

function EntrySeparator() {
  return <View className="h-2" />;
}

function TranscriptEntry({ item }: { item: TaskMessagePayload }) {
  switch (item.type) {
    case "thinking":
      return (
        <EntryCard icon="bulb-outline" labelKey="thinking" collapsible>
          <Text selectable className="text-sm italic text-muted-foreground">
            {item.content || "—"}
          </Text>
        </EntryCard>
      );
    case "tool_use":
      return <ToolCallEntry item={item} />;
    case "tool_result":
      return <ToolResultEntry item={item} />;
    case "error":
      return (
        <EntryCard icon="alert-circle-outline" labelKey="error" destructive>
          <Text selectable className="text-sm text-destructive">
            {item.content || "—"}
          </Text>
        </EntryCard>
      );
    case "text":
    default:
      return (
        <EntryCard icon="chatbubble-ellipses-outline" labelKey="output">
          {item.content ? (
            <Markdown content={item.content} />
          ) : (
            <Text className="text-sm text-muted-foreground">—</Text>
          )}
        </EntryCard>
      );
  }
}

function ToolCallEntry({ item }: { item: TaskMessagePayload }) {
  const { t } = useT("issues");
  const input =
    item.input && Object.keys(item.input).length > 0
      ? redactSecrets(JSON.stringify(item.input, null, 2))
      : "—";

  return (
    <EntryCard
      icon="construct-outline"
      labelKey="tool_call"
      detail={item.tool || t("runs.transcript.unknown_tool")}
      collapsible
    >
      <View className="rounded-md bg-muted px-3 py-2">
        <Text selectable className="font-mono text-xs text-muted-foreground">
          {input}
        </Text>
      </View>
    </EntryCard>
  );
}

function ToolResultEntry({ item }: { item: TaskMessagePayload }) {
  const { t } = useT("issues");
  const [showFullOutput, setShowFullOutput] = useState(false);
  const output = item.output ?? "";
  const clipped = output.length > DISPLAY_CLIP_CHARS;
  const shown = clipped && !showFullOutput
    ? `${output.slice(0, DISPLAY_CLIP_CHARS)}...`
    : output;

  return (
    <EntryCard icon="terminal-outline" labelKey="tool_output" detail={item.tool} collapsible>
      <View className="rounded-md bg-muted px-3 py-2">
        <Text selectable className="font-mono text-xs text-muted-foreground">
          {shown || "—"}
        </Text>
      </View>
      {clipped ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowFullOutput(!showFullOutput)}
          className="mt-2 py-1"
        >
          <Text className="text-sm text-brand">
            {t(showFullOutput ? "runs.transcript.show_less" : "runs.transcript.show_full_output")}
          </Text>
        </Pressable>
      ) : null}
      {item.output_truncated === true ? (
        <Text className="mt-2 text-xs text-muted-foreground">
          {t("runs.transcript.truncated")}
        </Text>
      ) : null}
    </EntryCard>
  );
}

function EntryCard({
  icon,
  labelKey,
  detail,
  destructive = false,
  collapsible = false,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: "thinking" | "error" | "output" | "tool_call" | "tool_output";
  detail?: string;
  destructive?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useT("issues");
  const [open, setOpen] = useState(false);
  const className = `rounded-lg border px-3 py-3 ${
    destructive ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
  }`;
  const heading = (
    <>
      <Ionicons name={icon} size={14} color={destructive ? "#dc2626" : "#71717a"} />
      <Text className={`flex-1 text-xs font-medium ${destructive ? "text-destructive" : "text-muted-foreground"}`}>
        {t(`runs.transcript.${labelKey}`)}{detail ? ` · ${detail}` : ""}
      </Text>
    </>
  );

  if (collapsible) {
    return (
      <Collapsible open={open} onOpenChange={setOpen} className={className}>
        <CollapsibleTrigger className="flex-row items-center gap-2">
          {heading}
          <Ionicons
            name={open ? "chevron-down" : "chevron-forward"}
            size={14}
            color="#71717a"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <View className={className}>
      <View className="mb-2 flex-row items-center gap-2">{heading}</View>
      {children}
    </View>
  );
}

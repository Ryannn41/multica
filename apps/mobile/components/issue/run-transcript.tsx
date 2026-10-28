import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TaskMessagePayload } from "@multica/core/types";
import { Text } from "@/components/ui/text";
import { Markdown } from "@/lib/markdown";
import { useT } from "@/lib/i18n";

const DISPLAY_CLIP_CHARS = 8_000;

export function RunTranscript({ items }: { items: TaskMessagePayload[] }) {
  const { t } = useT("issues");

  return (
    <View className="gap-2">
      {items.map((item, index) => (
        <TranscriptEntry
          key={`${item.task_id || "unknown"}-${item.seq}-${index}`}
          item={item}
        />
      ))}
      {items.length === 0 ? (
        <View className="items-center rounded-lg border border-dashed border-border px-4 py-8">
          <Text className="text-sm text-muted-foreground">
            {t("runs.transcript.empty")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function TranscriptEntry({ item }: { item: TaskMessagePayload }) {
  switch (item.type) {
    case "thinking":
      return (
        <EntryCard icon="bulb-outline" labelKey="thinking">
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
      ? JSON.stringify(item.input, null, 2)
      : null;

  return (
    <EntryCard icon="construct-outline" labelKey="tool_call">
      <Text className="text-sm font-medium text-foreground">
        {item.tool || t("runs.transcript.unknown_tool")}
      </Text>
      {input ? (
        <View className="mt-2 rounded-md bg-muted px-3 py-2">
          <Text selectable className="font-mono text-xs text-muted-foreground">
            {input}
          </Text>
        </View>
      ) : null}
    </EntryCard>
  );
}

function ToolResultEntry({ item }: { item: TaskMessagePayload }) {
  const { t } = useT("issues");
  const output = item.output ?? "";
  const clipped = output.length > DISPLAY_CLIP_CHARS;
  const shown = clipped ? output.slice(0, DISPLAY_CLIP_CHARS) : output;

  return (
    <EntryCard icon="terminal-outline" labelKey="tool_output">
      {item.tool ? (
        <Text className="mb-2 text-sm font-medium text-foreground">
          {item.tool}
        </Text>
      ) : null}
      <View className="rounded-md bg-muted px-3 py-2">
        <Text selectable className="font-mono text-xs text-muted-foreground">
          {shown || "—"}
        </Text>
      </View>
      {clipped || item.output_truncated === true ? (
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
  destructive = false,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  labelKey: "thinking" | "error" | "output" | "tool_call" | "tool_output";
  destructive?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useT("issues");
  return (
    <View
      className={`rounded-lg border px-3 py-3 ${
        destructive
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-card"
      }`}
    >
      <View className="mb-2 flex-row items-center gap-2">
        <Ionicons
          name={icon}
          size={14}
          color={destructive ? "#dc2626" : "#71717a"}
        />
        <Text
          className={`text-xs font-medium uppercase tracking-wide ${
            destructive ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {t(`runs.transcript.${labelKey}`)}
        </Text>
      </View>
      {children}
    </View>
  );
}

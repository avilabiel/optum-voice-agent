import type { Turn } from "@/db/schema";

export type TranscriptLine = {
  role: "assistant" | "user";
  text: string;
};

export function turnsToTranscript(turns: Turn[]): TranscriptLine[] {
  return turns.map((t) => ({ role: t.role, text: t.text }));
}

export function transcriptToText(lines: TranscriptLine[]): string {
  return lines.map(formatLine).join("\n");
}

function formatLine(line: TranscriptLine): string {
  const speaker = line.role === "assistant" ? "ASSISTANT" : "MEMBER";
  return `${speaker}: ${line.text}`;
}

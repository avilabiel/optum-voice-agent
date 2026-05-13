import { env } from "@/env";
import { questionnaireAsMarkdown } from "@/domain/questionnaire";
import { recordGeneration } from "@/observability/langfuse";
import {
  parsePatientTriageJson,
  parseTurnAuditJson,
  type PatientTriageResult,
  type TurnAuditResult,
} from "./judge-schemas";
import { openai } from "./openai-client";
import { patientTriagePromptText, turnAuditorPromptText } from "@/prompts/load-prompts";
import { transcriptToText, type TranscriptLine } from "./transcript";

type AuditTurnInput = {
  sessionId: string;
  turnId: string;
  turnText: string;
  transcriptUpToTurn: TranscriptLine[];
};

export async function auditTurn(input: AuditTurnInput): Promise<TurnAuditResult> {
  const userMessage = buildAuditUserMessage(input);
  const model = env().OPENAI_JUDGE_MODEL;

  const completion = await openai().chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: turnAuditorPromptText() },
      { role: "user", content: userMessage },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parseTurnAuditJson(raw);

  await recordGeneration({
    trace: {
      name: "turn-audit",
      sessionId: input.sessionId,
      metadata: { turnId: input.turnId },
    },
    name: "turn-audit",
    model,
    input: { systemPrompt: "turn-auditor.md", userMessage },
    output: parsed,
  });

  return parsed;
}

function buildAuditUserMessage(input: AuditTurnInput): string {
  return [
    "## Questionnaire",
    questionnaireAsMarkdown(),
    "",
    "## Transcript so far",
    transcriptToText(input.transcriptUpToTurn),
    "",
    "## Assistant turn to evaluate",
    input.turnText,
  ].join("\n");
}

type TriagePatientInput = {
  sessionId: string;
  memberFirstName: string;
  transcript: TranscriptLine[];
};

export async function triagePatient(input: TriagePatientInput): Promise<PatientTriageResult> {
  const userMessage = buildTriageUserMessage(input);
  const model = env().OPENAI_JUDGE_MODEL;

  const completion = await openai().chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: patientTriagePromptText() },
      { role: "user", content: userMessage },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parsePatientTriageJson(raw);

  await recordGeneration({
    trace: {
      name: "patient-triage",
      sessionId: input.sessionId,
    },
    name: "patient-triage",
    model,
    input: { systemPrompt: "patient-triage.md", userMessage },
    output: parsed,
  });

  return parsed;
}

function buildTriageUserMessage(input: TriagePatientInput): string {
  return [
    `## Member first name`,
    input.memberFirstName,
    "",
    "## Questionnaire",
    questionnaireAsMarkdown(),
    "",
    "## Transcript",
    transcriptToText(input.transcript),
  ].join("\n");
}

import { readFileSync } from "node:fs";
import path from "node:path";

const PROMPTS_DIR = path.join(process.cwd(), "src", "prompts");

export function loadPrompt(filename: string): string {
  return readFileSync(path.join(PROMPTS_DIR, filename), "utf8");
}

export function systemPromptText(): string {
  return loadPrompt("system-prompt.md");
}

export function turnAuditorPromptText(): string {
  return loadPrompt("turn-auditor.md");
}

export function patientTriagePromptText(): string {
  return loadPrompt("patient-triage.md");
}

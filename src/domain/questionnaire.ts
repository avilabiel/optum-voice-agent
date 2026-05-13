export type QuestionnaireSection = {
  id: "S1" | "S2" | "S3" | "S4" | "S5";
  title: string;
  intent: string;
  prompts: string[];
  followUps?: string[];
  escalationTriggers?: string[];
};

const memberConcerns: QuestionnaireSection = {
  id: "S1",
  title: "Member Concerns",
  intent: "Understand what the member is worried about and what they'd most like to improve.",
  prompts: [
    "To start, what concerns do you have about your health or wellness right now?",
    "If you could improve one thing about your health, what would it be?",
  ],
};

const pertinentConditions: QuestionnaireSection = {
  id: "S2",
  title: "Pertinent Conditions",
  intent: "Capture self-reported chronic conditions.",
  prompts: [
    "Are you managing any health conditions right now, like asthma, heart disease, diabetes, or heart failure?",
  ],
};

const primaryCareProvider: QuestionnaireSection = {
  id: "S3",
  title: "Primary Care Provider",
  intent: "Determine whether the member has a regular PCP and whether they want help finding one.",
  prompts: ["Do you have a doctor or nurse practitioner you see regularly?"],
  followUps: [
    "How often do you see them?",
    "Are you comfortable with the care they provide?",
  ],
};

const medications: QuestionnaireSection = {
  id: "S4",
  title: "Medications",
  intent: "Capture medication usage, adherence, side effects, and cost barriers.",
  prompts: ["Are you currently taking any prescription medications?"],
  followUps: [
    "Any challenges with doses or refills?",
    "Any side effects you've noticed?",
    "Any issues with cost or affordability?",
  ],
  escalationTriggers: ["cost barrier", "missed doses", "severe side effects"],
};

const socialDeterminants: QuestionnaireSection = {
  id: "S5",
  title: "Social Determinants",
  intent: "Surface non-clinical barriers to staying healthy.",
  prompts: [
    "Sometimes things like transportation, housing, or finances can make it harder to stay healthy. Is there anything like that you'd like to share?",
  ],
  escalationTriggers: ["transportation gap", "housing instability", "financial hardship"],
};

export const QUESTIONNAIRE: ReadonlyArray<QuestionnaireSection> = [
  memberConcerns,
  pertinentConditions,
  primaryCareProvider,
  medications,
  socialDeterminants,
];

export function sectionById(id: QuestionnaireSection["id"]): QuestionnaireSection {
  const found = QUESTIONNAIRE.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown questionnaire section: ${id}`);
  return found;
}

export function questionnaireAsMarkdown(): string {
  return QUESTIONNAIRE.map(sectionToMarkdown).join("\n\n");
}

function sectionToMarkdown(section: QuestionnaireSection): string {
  const lines: string[] = [];
  lines.push(`### ${section.id} — ${section.title}`);
  lines.push(`Intent: ${section.intent}`);
  lines.push("Prompts:");
  for (const p of section.prompts) {
    lines.push(`- ${p}`);
  }
  if (section.followUps && section.followUps.length > 0) {
    lines.push("Follow-ups:");
    for (const f of section.followUps) {
      lines.push(`- ${f}`);
    }
  }
  if (section.escalationTriggers && section.escalationTriggers.length > 0) {
    lines.push(`Escalation triggers: ${section.escalationTriggers.join(", ")}`);
  }
  return lines.join("\n");
}

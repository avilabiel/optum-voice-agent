export const VOICE_IDS = {
  jessica: "cgSgspJ2msm6clMCkdW9",
  laura: "FGY2WhTYpPnrIDTdsKH5",
  eric: "cjVigY5qzO86Huf0OWal",
} as const;

export type VoiceName = keyof typeof VOICE_IDS;

export function voiceIdFor(name: VoiceName): string {
  return VOICE_IDS[name];
}

export const DEFAULT_VOICE_SETTINGS = {
  stability: 0.45,
  similarityBoost: 0.75,
  style: 0.15,
  useSpeakerBoost: true,
};

export const PRONUNCIATION_REPLACEMENTS = [
  { type: "regex", regex: "\\bGLP-1\\b", value: "GLP one" },
  { type: "regex", regex: "\\bGLP-2\\b", value: "GLP two" },
  { type: "regex", regex: "\\bSGLT-2\\b", value: "SGLT two" },
  { type: "regex", regex: "\\bB-12\\b", value: "B twelve" },
  { type: "regex", regex: "\\bA1C\\b", value: "A one C" },
  { type: "regex", regex: "\\bCOVID-19\\b", value: "COVID nineteen" },
];

export const VOICE_FORMAT_PLAN = {
  enabled: true,
  formattersEnabled: ["markdown", "number"],
  replacements: PRONUNCIATION_REPLACEMENTS,
};

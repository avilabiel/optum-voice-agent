export const NURSE_CALLBACK_TOOL_NAME = "schedule_nurse_callback";

export function nurseCallbackToolDefinition() {
  return {
    type: "function",
    function: {
      name: NURSE_CALLBACK_TOOL_NAME,
      description:
        "Schedule a nurse callback for the member. Call this whenever the member accepts a nurse follow-up, has a medical question, mentions a cost barrier, or is in distress.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["reason"],
        properties: {
          reason: {
            type: "string",
            description: "Short description of why the nurse should call back.",
          },
          topic: {
            type: "string",
            description: "Specific topic the nurse should be ready to discuss, e.g. 'GLP-1 affordability'.",
          },
        },
      },
    },
  };
}

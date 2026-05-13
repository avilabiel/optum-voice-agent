export type MemberDto = {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  phone: string;
  priorityScore: number;
  priorityRationale: string | null;
  flags: string[];
  lastCallAt: string | null;
};

export type TicketDto = {
  id: string;
  memberFirstName: string;
  memberLastName: string;
  memberExternalId: string;
  topic: string;
  reason: string | null;
  origin: "member_requested" | "system_initiated";
  status: "open" | "claimed" | "completed" | "cancelled";
  slaTier: "urgent_24h" | "priority_72h" | "routine_1w" | null;
  dueAt: string | null;
  priorityScore: number | null;
  createdAt: string;
};

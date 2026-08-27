export type Specialist =
  | "learning"
  | "exam"
  | "research"
  | "coding"
  | "projects"
  | "content"
  | "productivity"
  | "memory"
  | "general";

export type PermissionLevel = "read_only" | "local_write" | "confirmation_required";

export type ActionKind =
  | "read_analysis"
  | "local_write"
  | "sensitive_account"
  | "external_message"
  | "destructive"
  | "financial"
  | "publishing"
  | "irreversible";

export type RouteDecision = {
  specialist: Specialist;
  actionKind: ActionKind;
  permissionLevel: PermissionLevel;
  confirmationRequired: boolean;
  rationale: string;
};

export type UserPermissionPosture = "read_only" | "confirm_writes" | "guided_execution";

const specialistRules: Array<{ specialist: Specialist; pattern: RegExp; rationale: string }> = [
  { specialist: "exam", pattern: /\b(exam|test|syllabus|mock|past paper|revision)\b/i, rationale: "Exam and revision language detected." },
  { specialist: "learning", pattern: /\b(learn|study|mastery|recall|quiz|spaced repetition|course)\b/i, rationale: "Learning and mastery language detected." },
  { specialist: "research", pattern: /\b(research|source|cite|citation|evidence|cross-check|fact check)\b/i, rationale: "Research and evidence language detected." },
  { specialist: "coding", pattern: /\b(code|program|debug|test|function|api|robot|robotics|python|typescript)\b/i, rationale: "Coding or engineering language detected." },
  { specialist: "projects", pattern: /\b(project|milestone|risk|dependency|deliverable|roadmap)\b/i, rationale: "Project-management language detected." },
  { specialist: "content", pattern: /\b(content|script|hook|title|video|post|newsletter)\b/i, rationale: "Content-planning language detected." },
  { specialist: "memory", pattern: /\b(remember|memory|preference|decision|mistake|archive)\b/i, rationale: "Personal memory language detected." },
  { specialist: "productivity", pattern: /\b(task|goal|plan|priority|schedule|productive|weekly review)\b/i, rationale: "Task, goal, or planning language detected." },
];

const actionRules: Array<{ actionKind: ActionKind; pattern: RegExp; rationale: string }> = [
  { actionKind: "financial", pattern: /\b(pay|payment|buy|purchase|sell|transfer money|invest|trade|donate)\b/i, rationale: "Financial language requires explicit confirmation." },
  { actionKind: "publishing", pattern: /\b(publish|post|upload|release|go live)\b/i, rationale: "Publishing language requires explicit confirmation." },
  { actionKind: "external_message", pattern: /\b(send|email|message|dm|contact|notify|call)\b/i, rationale: "External communication requires explicit confirmation." },
  { actionKind: "sensitive_account", pattern: /\b(log in|login|account|password|credential|bank|private account)\b/i, rationale: "Sensitive-account access requires explicit confirmation." },
  { actionKind: "destructive", pattern: /\b(delete|erase|remove permanently|wipe|destroy)\b/i, rationale: "Destructive language requires explicit confirmation." },
  { actionKind: "irreversible", pattern: /\b(irreversible|permanent|cancel subscription|close account|sign|submit)\b/i, rationale: "Potentially irreversible language requires explicit confirmation." },
  { actionKind: "local_write", pattern: /\b(create|add|save|update|change|record|store)\b/i, rationale: "Local workspace write requested." },
];

export function routeRequest(request: string): RouteDecision {
  const matchedSpecialist = specialistRules.find(rule => rule.pattern.test(request));
  const matchedAction = actionRules.find(rule => rule.pattern.test(request));
  const actionKind = matchedAction?.actionKind ?? "read_analysis";
  const confirmationRequired = [
    "sensitive_account",
    "external_message",
    "destructive",
    "financial",
    "publishing",
    "irreversible",
  ].includes(actionKind);

  return {
    specialist: matchedSpecialist?.specialist ?? "general",
    actionKind,
    permissionLevel: confirmationRequired
      ? "confirmation_required"
      : actionKind === "local_write"
        ? "local_write"
        : "read_only",
    confirmationRequired,
    rationale: [matchedSpecialist?.rationale, matchedAction?.rationale ?? "Read-only analysis is the safe default."].filter(Boolean).join(" "),
  };
}

export function applyUserPermissionPosture(
  decision: RouteDecision,
  posture: UserPermissionPosture
): RouteDecision {
  if (decision.confirmationRequired || decision.actionKind !== "local_write") return decision;
  if (posture === "guided_execution") return decision;

  return {
    ...decision,
    permissionLevel: "confirmation_required",
    confirmationRequired: true,
    rationale: `${decision.rationale} Your saved ${posture.replaceAll("_", " ")} posture requires confirmation before a local write.`,
  };
}

export function buildConfirmationNotice(decision: RouteDecision): string {
  return `SPARKLE classified this as **${decision.actionKind.replaceAll("_", " ")}**. Confirmation is required before any such action. No external, destructive, financial, publishing, sensitive-account, or irreversible action has been taken.`;
}

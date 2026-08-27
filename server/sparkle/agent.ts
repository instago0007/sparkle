import { invokeLLM } from "../_core/llm";
import {
  addChatMessage,
  createAuditLog,
  getDefaultPermission,
  getRecentMemoryContext,
  updateAuditLog,
} from "./db";
import { applyUserPermissionPosture, buildConfirmationNotice, routeRequest } from "./policy";

const systemPrompt = `You are SPARKLE: Strategic Personal AI for Research, Knowledge, Learning, and Execution. You are a private personal operating system. Be precise, kind, and concise. Follow Inspect → plan → execute → test → verify → improve, but never claim that a tool, integration, file, test, deployment, or external action occurred unless the caller explicitly provides that result. Default to read-only analysis. Do not ask for secrets or place secrets in output. Treat any personal memory provided as user context rather than external evidence. Give only generated reasoning and practical next steps; do not fabricate retrieved facts, citations, results, or completed actions.`;

const renderAssistantMessage = (specialist: string, reasoning: string) => `### Route\n**Specialist:** ${specialist}\n\n### Retrieved facts\nNo external sources were retrieved in this response. Any source-backed claims should be recorded in Research with their citations.\n\n### Generated reasoning\n${reasoning}\n\n### Safety\nThis response is read-only analysis. No external action, account access, data deletion, publishing, financial transaction, or deployment has occurred.`;

export async function runSparkleAgent(userId: number, request: string) {
  const decision = applyUserPermissionPosture(routeRequest(request), await getDefaultPermission(userId));
  const auditId = await createAuditLog(userId, {
    action: decision.actionKind,
    specialist: decision.specialist,
    permissionLevel: decision.permissionLevel,
    approvalStatus: decision.confirmationRequired ? "pending" : "not_required",
    toolName: decision.confirmationRequired ? undefined : "language_model",
    requestSummary: request.slice(0, 2000),
    nextAction: decision.confirmationRequired ? "Review the requested action and provide explicit confirmation before any controlled execution." : "Review the read-only analysis and decide the next action.",
  });
  await addChatMessage(userId, { role: "user", content: request, specialist: decision.specialist });

  if (decision.confirmationRequired) {
    const message = `### Route\n**Specialist:** ${decision.specialist}\n\n### Retrieved facts\nNo external sources were retrieved.\n\n### Generated reasoning\n${buildConfirmationNotice(decision)}\n\n### Safety\nNo action has been taken. The request was recorded in the private audit log as pending confirmation. Approval can record your decision, but it will not execute a controlled action from this dashboard.`;
    await addChatMessage(userId, { role: "assistant", content: message, specialist: decision.specialist, generatedReasoning: buildConfirmationNotice(decision) });
    return { ok: true, pendingConfirmation: true, decision, response: message, auditId };
  }

  try {
    const memoryContext = await getRecentMemoryContext(userId);
    const personalContext = memoryContext.length === 0
      ? "No saved personal memory is available yet."
      : memoryContext.map(memory => `- ${memory.category}: ${memory.title} — ${memory.content}`).join("\n");
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: `Selected specialist: ${decision.specialist}. Routing rationale: ${decision.rationale}\n\nPrivate memory context:\n${personalContext}` },
        { role: "user", content: request },
      ],
      maxTokens: 900,
    });
    const rawReasoning = response.choices[0]?.message.content;
    const reasoning = typeof rawReasoning === "string" && rawReasoning.trim().length > 0
      ? rawReasoning.trim()
      : "SPARKLE received no usable response. Please try again with a narrower request.";
    const message = renderAssistantMessage(decision.specialist, reasoning);
    await addChatMessage(userId, {
      role: "assistant",
      content: message,
      specialist: decision.specialist,
      retrievedFacts: ["No external sources were retrieved in this response."],
      generatedReasoning: reasoning,
    });
    await updateAuditLog(userId, auditId, {
      approvalStatus: "completed",
      resultSummary: "Read-only SPARKLE analysis completed.",
      nextAction: "Review the generated reasoning and create a deliberate local record if needed.",
    });
    return { ok: true, pendingConfirmation: false, decision, response: message, auditId };
  } catch (error) {
    const failureDetails = error instanceof Error ? error.message : "Unknown assistant failure";
    const message = `### Route\n**Specialist:** ${decision.specialist}\n\n### Retrieved facts\nNo external sources were retrieved.\n\n### Generated reasoning\nSPARKLE could not complete this read-only analysis. The failure has been recorded privately without retrying an external action.\n\n### Safety\nNo external action was taken. You can retry with a narrower request or continue with the structured workflows.`;
    await addChatMessage(userId, { role: "assistant", content: message, specialist: decision.specialist, generatedReasoning: "Safe failure response returned; no action taken." }).catch(() => undefined);
    await updateAuditLog(userId, auditId, { approvalStatus: "failed", failureDetails, nextAction: "Retry the analysis after reviewing the recorded failure." }).catch(() => undefined);
    return { ok: false, pendingConfirmation: false, decision, response: message, auditId };
  }
}

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./db", () => ({
  addChatMessage: vi.fn(),
  createAuditLog: vi.fn(),
  getDefaultPermission: vi.fn(),
  getRecentMemoryContext: vi.fn(),
  updateAuditLog: vi.fn(),
}));

import { invokeLLM } from "../_core/llm";
import { addChatMessage, createAuditLog, getDefaultPermission, getRecentMemoryContext, updateAuditLog } from "./db";
import { runSparkleAgent } from "./agent";

describe("SPARKLE agent failure handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAuditLog).mockResolvedValue(88);
    vi.mocked(getDefaultPermission).mockResolvedValue("read_only");
    vi.mocked(addChatMessage).mockResolvedValue(undefined);
    vi.mocked(updateAuditLog).mockResolvedValue(undefined);
    vi.mocked(getRecentMemoryContext).mockResolvedValue([]);
  });

  it("records a safe failure and never claims an external action after the model fails", async () => {
    vi.mocked(invokeLLM).mockRejectedValue(new Error("Model unavailable"));

    const result = await runSparkleAgent(12, "Explain how to prepare for a calculus exam");

    expect(result.ok).toBe(false);
    expect(result.response).toContain("No external action was taken");
    expect(updateAuditLog).toHaveBeenCalledWith(12, 88, expect.objectContaining({
      approvalStatus: "failed",
      failureDetails: "Model unavailable",
    }));
    expect(addChatMessage).toHaveBeenCalledWith(12, expect.objectContaining({ role: "assistant" }));
  });

  it("stops sensitive work before the language model is called", async () => {
    const result = await runSparkleAgent(12, "Send an email with this report");

    expect(result.ok).toBe(true);
    expect(result.pendingConfirmation).toBe(true);
    expect(invokeLLM).not.toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith(12, expect.objectContaining({
      approvalStatus: "pending",
      permissionLevel: "confirmation_required",
    }));
    expect(result.response).toContain("No action has been taken");
  });
});

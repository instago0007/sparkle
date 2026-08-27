import { describe, expect, it } from "vitest";
import { applyUserPermissionPosture, buildConfirmationNotice, routeRequest } from "./policy";

describe("SPARKLE request routing", () => {
  it("routes a study request to the learning specialist as safe read-only analysis", () => {
    const decision = routeRequest("Help me learn control systems with active recall prompts");

    expect(decision.specialist).toBe("learning");
    expect(decision.actionKind).toBe("read_analysis");
    expect(decision.permissionLevel).toBe("read_only");
    expect(decision.confirmationRequired).toBe(false);
  });

  it("routes a coding request to the coding specialist", () => {
    const decision = routeRequest("Debug this Python robotics program and propose tests");

    expect(decision.specialist).toBe("coding");
    expect(decision.confirmationRequired).toBe(false);
  });
});

describe("SPARKLE permission enforcement", () => {
  it("honors a saved confirm-writes posture for otherwise local-only work", () => {
    const decision = applyUserPermissionPosture(routeRequest("Save this as a project note"), "confirm_writes");

    expect(decision.actionKind).toBe("local_write");
    expect(decision.permissionLevel).toBe("confirmation_required");
    expect(decision.confirmationRequired).toBe(true);
  });

  it("allows local-write routing only when guided execution is explicitly selected", () => {
    const decision = applyUserPermissionPosture(routeRequest("Save this as a project note"), "guided_execution");

    expect(decision.permissionLevel).toBe("local_write");
    expect(decision.confirmationRequired).toBe(false);
  });

  it("requires confirmation before publishing", () => {
    const decision = routeRequest("Publish this article to my blog");

    expect(decision.actionKind).toBe("publishing");
    expect(decision.permissionLevel).toBe("confirmation_required");
    expect(decision.confirmationRequired).toBe(true);
    expect(buildConfirmationNotice(decision)).toContain("No external, destructive, financial, publishing");
  });

  it("requires confirmation before a financial action", () => {
    const decision = routeRequest("Buy the parts for my robotics project");

    expect(decision.actionKind).toBe("financial");
    expect(decision.confirmationRequired).toBe(true);
  });

  it("requires confirmation before deleting data", () => {
    const decision = routeRequest("Delete every saved memory permanently");

    expect(decision.actionKind).toBe("destructive");
    expect(decision.confirmationRequired).toBe(true);
  });
});

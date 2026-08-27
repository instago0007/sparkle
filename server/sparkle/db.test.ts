import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ getDb: vi.fn() }));

import { getDb } from "../db";
import { archiveMemory, createMemory } from "./db";

describe("SPARKLE memory persistence", () => {
  const insertValues = vi.fn();
  const updateWhere = vi.fn();
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const fakeDb = {
    insert: vi.fn(() => ({ values: insertValues })),
    update: vi.fn(() => ({ set: updateSet })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    insertValues.mockResolvedValue({});
    updateWhere.mockResolvedValue({});
    vi.mocked(getDb).mockResolvedValue(fakeDb as never);
  });

  it("writes a memory under the requesting user and preserves sensitivity metadata", async () => {
    await createMemory(42, {
      category: "decision",
      title: "Robotics focus",
      content: "Prioritize sensor fusion before adding new hardware.",
      sourceType: "user",
      confidence: 100,
      isSensitive: true,
    });

    expect(fakeDb.insert).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      category: "decision",
      title: "Robotics focus",
      isSensitive: true,
      confidence: 100,
    }));
  });

  it("archives rather than deleting a memory record", async () => {
    await archiveMemory(42, 7);

    expect(fakeDb.update).toHaveBeenCalledTimes(1);
    expect(updateSet).toHaveBeenCalledWith({ status: "archived" });
    expect(updateWhere).toHaveBeenCalledTimes(1);
  });
});

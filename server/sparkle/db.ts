import { and, desc, eq } from "drizzle-orm";
import {
  auditLogs,
  chatMessages,
  contentPlans,
  examPlans,
  goals,
  learningPlans,
  memories,
  projectStates,
  projects,
  researchRecords,
  skills,
  sparkleProfiles,
  tasks,
  type ResearchSource,
} from "../../drizzle/schema";
import { getDb } from "../db";
import type { PermissionLevel, Specialist } from "./policy";

const DEFAULT_STATE = {
  version: "SPARKLE 0.1",
  phase: "Foundation",
  currentTask: "Create a first goal or capture a task.",
  completed: [] as string[],
  inProgress: [] as string[],
  blocked: [] as string[],
  failedTests: [] as string[],
  nextAction: "Define a first goal or capture the next task.",
  completionPercent: 0,
};

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("The private SPARKLE data store is currently unavailable.");
  return db;
}

export async function ensureSparkleWorkspace(userId: number) {
  const db = await requireDb();
  const [profile] = await db.select().from(sparkleProfiles).where(eq(sparkleProfiles.userId, userId)).limit(1);
  if (!profile) {
    await db.insert(sparkleProfiles).values({ userId, preferences: {}, defaultPermission: "read_only" });
  }
  const [state] = await db.select().from(projectStates).where(eq(projectStates.userId, userId)).limit(1);
  if (!state) await db.insert(projectStates).values({ userId, ...DEFAULT_STATE });
  return refreshProjectState(userId);
}

export async function refreshProjectState(userId: number) {
  const db = await requireDb();
  const [state] = await db.select().from(projectStates).where(eq(projectStates.userId, userId)).limit(1);
  const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.updatedAt));
  const failedAudits = await db.select().from(auditLogs).where(and(eq(auditLogs.userId, userId), eq(auditLogs.approvalStatus, "failed"))).orderBy(desc(auditLogs.updatedAt)).limit(5);
  const completed = userTasks.filter(task => task.status === "completed").map(task => task.title);
  const inProgress = userTasks.filter(task => task.status === "in_progress").map(task => task.title);
  const blocked = userTasks.filter(task => task.status === "blocked").map(task => task.title);
  const current = userTasks.find(task => task.status === "in_progress") ?? userTasks.find(task => task.status === "not_started");
  const completionPercent = userTasks.length === 0 ? 0 : Math.round((completed.length / userTasks.length) * 100);
  const values = {
    completed,
    inProgress,
    blocked,
    failedTests: failedAudits.map(audit => audit.failureDetails ?? audit.action),
    currentTask: current?.title ?? state?.currentTask ?? DEFAULT_STATE.currentTask,
    nextAction: current?.nextAction ?? current?.title ?? state?.nextAction ?? DEFAULT_STATE.nextAction,
    completionPercent,
  };
  if (state) {
    await db.update(projectStates).set(values).where(eq(projectStates.id, state.id));
  } else {
    await db.insert(projectStates).values({ userId, ...DEFAULT_STATE, ...values });
  }
  const [refreshed] = await db.select().from(projectStates).where(eq(projectStates.userId, userId)).limit(1);
  return refreshed!;
}

export async function getWorkspaceDashboard(userId: number) {
  await ensureSparkleWorkspace(userId);
  const db = await requireDb();
  const state = await refreshProjectState(userId);
  const [profile] = await db.select().from(sparkleProfiles).where(eq(sparkleProfiles.userId, userId)).limit(1);
  const [allTasks, allGoals, allProjects, allSkills, allLearningPlans, allExamPlans, allMemories, allResearch, allContent, allChat, allAudit] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.updatedAt)).limit(30),
    db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.updatedAt)).limit(20),
    db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt)).limit(20),
    db.select().from(skills).where(eq(skills.userId, userId)).orderBy(desc(skills.updatedAt)).limit(30),
    db.select().from(learningPlans).where(eq(learningPlans.userId, userId)).orderBy(desc(learningPlans.updatedAt)).limit(20),
    db.select().from(examPlans).where(eq(examPlans.userId, userId)).orderBy(desc(examPlans.updatedAt)).limit(20),
    db.select().from(memories).where(eq(memories.userId, userId)).orderBy(desc(memories.updatedAt)).limit(40),
    db.select().from(researchRecords).where(eq(researchRecords.userId, userId)).orderBy(desc(researchRecords.updatedAt)).limit(20),
    db.select().from(contentPlans).where(eq(contentPlans.userId, userId)).orderBy(desc(contentPlans.updatedAt)).limit(20),
    db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(desc(chatMessages.createdAt)).limit(30),
    db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt)).limit(40),
  ]);
  return {
    profile: profile!,
    state,
    tasks: allTasks,
    goals: allGoals,
    projects: allProjects,
    skills: allSkills,
    learningPlans: allLearningPlans,
    examPlans: allExamPlans,
    memories: allMemories,
    research: allResearch,
    content: allContent,
    chat: allChat.reverse(),
    audit: allAudit,
  };
}

export async function updateProfile(userId: number, input: { displayName?: string; headline?: string; preferences?: Record<string, string | boolean | number>; defaultPermission?: "read_only" | "confirm_writes" | "guided_execution" }) {
  await ensureSparkleWorkspace(userId);
  const db = await requireDb();
  await db.update(sparkleProfiles).set({ ...input }).where(eq(sparkleProfiles.userId, userId));
}

export async function getDefaultPermission(userId: number) {
  await ensureSparkleWorkspace(userId);
  const db = await requireDb();
  const [profile] = await db.select().from(sparkleProfiles).where(eq(sparkleProfiles.userId, userId)).limit(1);
  return profile?.defaultPermission ?? "read_only";
}

export async function createGoal(userId: number, input: { title: string; description?: string; horizon: "daily" | "weekly" | "monthly" | "quarterly" | "long_term"; successMetric?: string; targetDate?: Date }) {
  const db = await requireDb();
  await db.insert(goals).values({ userId, ...input });
}

export async function createTask(userId: number, input: { title: string; description?: string; status: "not_started" | "in_progress" | "blocked" | "completed"; priority: "low" | "medium" | "high" | "critical"; dependencies: string[]; nextAction?: string; dueAt?: Date; goalId?: number; projectId?: number }) {
  const db = await requireDb();
  await db.insert(tasks).values({ userId, ...input, completedAt: input.status === "completed" ? new Date() : undefined });
  return refreshProjectState(userId);
}

export async function updateTaskStatus(userId: number, taskId: number, status: "not_started" | "in_progress" | "blocked" | "completed") {
  const db = await requireDb();
  await db.update(tasks).set({ status, completedAt: status === "completed" ? new Date() : null }).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
  return refreshProjectState(userId);
}

export async function createProject(userId: number, input: { title: string; description?: string; status: "planning" | "active" | "blocked" | "completed" | "archived"; milestones: string[]; risks: string[]; dependencies: string[]; nextAction?: string; targetDate?: Date }) {
  const db = await requireDb();
  await db.insert(projects).values({ userId, ...input });
}

export async function createSkill(userId: number, input: { name: string; category: string; proficiency: number; evidence?: string; nextAction?: string }) {
  const db = await requireDb();
  await db.insert(skills).values({ userId, ...input });
}

export async function createLearningPlan(userId: number, input: { title: string; topic: string; status: "planning" | "active" | "reviewing" | "mastered" | "archived"; objectives: string[]; activeRecall: string[]; quizPrompts: string[]; revisionSchedule: string[]; masteryEvidence: string[]; nextReviewAt?: Date }) {
  const db = await requireDb();
  await db.insert(learningPlans).values({ userId, ...input });
}

export async function completeLearningReview(userId: number, planId: number) {
  const db = await requireDb();
  const [plan] = await db.select().from(learningPlans).where(and(eq(learningPlans.id, planId), eq(learningPlans.userId, userId))).limit(1);
  if (!plan) throw new Error("Learning plan not found in this private workspace.");
  const reviewIntervals = [1, 3, 7, 14, 30, 45];
  const intervalDays = reviewIntervals[Math.min(plan.reviewCount, reviewIntervals.length - 1)];
  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  await db.update(learningPlans).set({
    status: "reviewing",
    reviewCount: plan.reviewCount + 1,
    lastReviewedAt: now,
    nextReviewAt,
  }).where(and(eq(learningPlans.id, planId), eq(learningPlans.userId, userId)));
  return { intervalDays, nextReviewAt };
}

export async function createExamPlan(userId: number, input: { title: string; examDate?: Date; status: "planning" | "preparing" | "completed" | "archived"; syllabus: string[]; practiceTests: string[]; errorAnalysis: string[]; revisionPlan: string[]; masteryEvidence: string[]; nextAction?: string }) {
  const db = await requireDb();
  await db.insert(examPlans).values({ userId, ...input });
}

export async function createMemory(userId: number, input: { category: "profile" | "goal" | "preference" | "decision" | "mistake" | "knowledge" | "learning" | "research" | "other"; title: string; content: string; sourceType: "user" | "assistant" | "research"; sourceUrl?: string; confidence: number; isSensitive: boolean }) {
  const db = await requireDb();
  await db.insert(memories).values({ userId, ...input });
}

export async function archiveMemory(userId: number, memoryId: number) {
  const db = await requireDb();
  await db.update(memories).set({ status: "archived" }).where(and(eq(memories.id, memoryId), eq(memories.userId, userId)));
}

export async function createResearchRecord(userId: number, input: { question: string; status: "collecting" | "cross_checking" | "synthesized" | "archived"; sources: ResearchSource[]; retrievedFacts: string[]; generatedReasoning?: string; crossCheckNotes?: string; uncertainty?: string }) {
  const db = await requireDb();
  await db.insert(researchRecords).values({ userId, ...input });
}

export async function createContentPlan(userId: number, input: { title: string; channel?: string; status: "idea" | "researching" | "drafting" | "ready" | "published" | "archived"; audience?: string; hook?: string; outline: string[]; productionPlan: string[]; nextAction?: string }) {
  const db = await requireDb();
  await db.insert(contentPlans).values({ userId, ...input });
}

export async function addChatMessage(userId: number, input: { role: "user" | "assistant"; content: string; specialist?: Specialist; retrievedFacts?: string[]; generatedReasoning?: string; citations?: ResearchSource[] }) {
  const db = await requireDb();
  await db.insert(chatMessages).values({ userId, role: input.role, content: input.content, specialist: input.specialist, retrievedFacts: input.retrievedFacts ?? [], generatedReasoning: input.generatedReasoning, citations: input.citations ?? [] });
}

export async function getRecentMemoryContext(userId: number) {
  const db = await requireDb();
  return db.select().from(memories).where(and(eq(memories.userId, userId), eq(memories.status, "active"))).orderBy(desc(memories.updatedAt)).limit(6);
}

export async function createAuditLog(userId: number, input: { action: string; specialist?: Specialist; permissionLevel: PermissionLevel; approvalStatus: "not_required" | "pending" | "approved" | "denied" | "completed" | "failed"; toolName?: string; requestSummary: string; resultSummary?: string; failureDetails?: string; nextAction?: string }) {
  const db = await requireDb();
  const result = await db.insert(auditLogs).values({ userId, ...input });
  return Number(result[0].insertId);
}

export async function updateAuditLog(userId: number, auditId: number, input: { approvalStatus?: "not_required" | "pending" | "approved" | "denied" | "completed" | "failed"; resultSummary?: string; failureDetails?: string; nextAction?: string }) {
  const db = await requireDb();
  await db.update(auditLogs).set(input).where(and(eq(auditLogs.id, auditId), eq(auditLogs.userId, userId)));
}

export async function reviewPendingAudit(userId: number, auditId: number, decision: "approved" | "denied") {
  const db = await requireDb();
  const [audit] = await db.select().from(auditLogs).where(and(eq(auditLogs.id, auditId), eq(auditLogs.userId, userId))).limit(1);
  if (!audit || audit.approvalStatus !== "pending") throw new Error("Only a pending request in your private audit log can be reviewed.");
  const approved = decision === "approved";
  await db.update(auditLogs).set({
    approvalStatus: decision,
    resultSummary: approved
      ? "Approval recorded. No controlled action was executed because this private dashboard has no external action integration connected."
      : "Approval denied. No action was taken.",
    nextAction: approved
      ? "The request remains unexecuted. Review it again only if you explicitly choose to connect a dedicated controlled integration."
      : "No action is needed. The request remains unexecuted.",
  }).where(and(eq(auditLogs.id, auditId), eq(auditLogs.userId, userId)));
}

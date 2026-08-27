import { z } from "zod";
import type { ResearchSource } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { runSparkleAgent } from "../sparkle/agent";
import {
  archiveMemory,
  completeLearningReview,
  createContentPlan,
  createExamPlan,
  createGoal,
  createLearningPlan,
  createMemory,
  createProject,
  createResearchRecord,
  createSkill,
  createTask,
  getWorkspaceDashboard,
  reviewPendingAudit,
  updateProfile,
  updateTaskStatus,
} from "../sparkle/db";

const splitList = z.array(z.string().trim().min(1)).default([]);
const sourceSchema = z.object({ title: z.string().trim().min(1).max(320), url: z.string().url().max(2048), note: z.string().trim().max(1000).optional() });

export const sparkleRouter = router({
  dashboard: protectedProcedure.query(({ ctx }) => getWorkspaceDashboard(ctx.user.id)),
  profile: router({
    update: protectedProcedure.input(z.object({ displayName: z.string().trim().min(1).max(140).optional(), headline: z.string().trim().max(1000).optional(), preferences: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional(), defaultPermission: z.enum(["read_only", "confirm_writes", "guided_execution"]).optional() })).mutation(async ({ ctx, input }) => {
      await updateProfile(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  goals: router({
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(240), description: z.string().trim().max(5000).optional(), horizon: z.enum(["daily", "weekly", "monthly", "quarterly", "long_term"]).default("quarterly"), successMetric: z.string().trim().max(1000).optional(), targetDate: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      await createGoal(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  tasks: router({
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(240), description: z.string().trim().max(5000).optional(), status: z.enum(["not_started", "in_progress", "blocked", "completed"]).default("not_started"), priority: z.enum(["low", "medium", "high", "critical"]).default("medium"), dependencies: splitList, nextAction: z.string().trim().max(1000).optional(), dueAt: z.coerce.date().optional(), goalId: z.number().int().positive().optional(), projectId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      await createTask(ctx.user.id, input);
      return { success: true } as const;
    }),
    updateStatus: protectedProcedure.input(z.object({ taskId: z.number().int().positive(), status: z.enum(["not_started", "in_progress", "blocked", "completed"]) })).mutation(async ({ ctx, input }) => {
      await updateTaskStatus(ctx.user.id, input.taskId, input.status);
      return { success: true } as const;
    }),
  }),
  projects: router({
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(240), description: z.string().trim().max(5000).optional(), status: z.enum(["planning", "active", "blocked", "completed", "archived"]).default("planning"), milestones: splitList, risks: splitList, dependencies: splitList, nextAction: z.string().trim().max(1000).optional(), targetDate: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      await createProject(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  skills: router({
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(160), category: z.string().trim().min(1).max(96), proficiency: z.number().int().min(1).max(5), evidence: z.string().trim().max(3000).optional(), nextAction: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      await createSkill(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  learning: router({
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(240), topic: z.string().trim().min(1).max(240), status: z.enum(["planning", "active", "reviewing", "mastered", "archived"]).default("planning"), objectives: splitList, activeRecall: splitList, quizPrompts: splitList, revisionSchedule: splitList, masteryEvidence: splitList, nextReviewAt: z.coerce.date().optional() })).mutation(async ({ ctx, input }) => {
      await createLearningPlan(ctx.user.id, input);
      return { success: true } as const;
    }),
    completeReview: protectedProcedure.input(z.object({ planId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      return completeLearningReview(ctx.user.id, input.planId);
    }),
  }),
  exams: router({
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(240), examDate: z.coerce.date().optional(), status: z.enum(["planning", "preparing", "completed", "archived"]).default("planning"), syllabus: splitList, practiceTests: splitList, errorAnalysis: splitList, revisionPlan: splitList, masteryEvidence: splitList, nextAction: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      await createExamPlan(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  memory: router({
    create: protectedProcedure.input(z.object({ category: z.enum(["profile", "goal", "preference", "decision", "mistake", "knowledge", "learning", "research", "other"]).default("other"), title: z.string().trim().min(1).max(240), content: z.string().trim().min(1).max(10000), sourceType: z.enum(["user", "assistant", "research"]).default("user"), sourceUrl: z.string().url().max(2048).optional(), confidence: z.number().int().min(0).max(100).default(100), isSensitive: z.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      await createMemory(ctx.user.id, input);
      return { success: true } as const;
    }),
    archive: protectedProcedure.input(z.object({ memoryId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await archiveMemory(ctx.user.id, input.memoryId);
      return { success: true } as const;
    }),
  }),
  research: router({
    create: protectedProcedure.input(z.object({ question: z.string().trim().min(1).max(10000), status: z.enum(["collecting", "cross_checking", "synthesized", "archived"]).default("collecting"), sources: z.array(sourceSchema).default([]), retrievedFacts: splitList, generatedReasoning: z.string().trim().max(10000).optional(), crossCheckNotes: z.string().trim().max(5000).optional(), uncertainty: z.string().trim().max(3000).optional() })).mutation(async ({ ctx, input }) => {
      await createResearchRecord(ctx.user.id, input as typeof input & { sources: ResearchSource[] });
      return { success: true } as const;
    }),
  }),
  content: router({
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(240), channel: z.string().trim().max(120).optional(), status: z.enum(["idea", "researching", "drafting", "ready", "published", "archived"]).default("idea"), audience: z.string().trim().max(2000).optional(), hook: z.string().trim().max(2000).optional(), outline: splitList, productionPlan: splitList, nextAction: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
      await createContentPlan(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  agent: router({
    run: protectedProcedure.input(z.object({ request: z.string().trim().min(1).max(12000) })).mutation(({ ctx, input }) => runSparkleAgent(ctx.user.id, input.request)),
  }),
  audit: router({
    review: protectedProcedure.input(z.object({ auditId: z.number().int().positive(), decision: z.enum(["approved", "denied"]) })).mutation(async ({ ctx, input }) => {
      await reviewPendingAudit(ctx.user.id, input.auditId, input.decision);
      return { success: true } as const;
    }),
  }),
});

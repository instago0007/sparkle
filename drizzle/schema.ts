import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const sparkleProfiles = mysqlTable(
  "sparkle_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("displayName", { length: 140 }),
    headline: text("headline"),
    preferences: json("preferences").$type<Record<string, string | boolean | number>>().notNull(),
    defaultPermission: mysqlEnum("defaultPermission", ["read_only", "confirm_writes", "guided_execution"])
      .default("read_only")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("sparkle_profiles_user_unique").on(table.userId)],
);

export const projectStates = mysqlTable(
  "project_states",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    version: varchar("version", { length: 48 }).notNull(),
    phase: varchar("phase", { length: 96 }).notNull(),
    currentTask: text("currentTask").notNull(),
    completed: json("completed").$type<string[]>().notNull(),
    inProgress: json("inProgress").$type<string[]>().notNull(),
    blocked: json("blocked").$type<string[]>().notNull(),
    failedTests: json("failedTests").$type<string[]>().notNull(),
    nextAction: text("nextAction").notNull(),
    completionPercent: int("completionPercent").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("project_states_user_unique").on(table.userId)],
);

export const goals = mysqlTable(
  "goals",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description"),
    horizon: mysqlEnum("horizon", ["daily", "weekly", "monthly", "quarterly", "long_term"])
      .default("quarterly")
      .notNull(),
    status: mysqlEnum("status", ["active", "paused", "achieved", "archived"]).default("active").notNull(),
    successMetric: text("successMetric"),
    targetDate: timestamp("targetDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("goals_user_status_idx").on(table.userId, table.status)],
);

export const tasks = mysqlTable(
  "tasks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    goalId: int("goalId"),
    projectId: int("projectId"),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["not_started", "in_progress", "blocked", "completed"])
      .default("not_started")
      .notNull(),
    priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
    dependencies: json("dependencies").$type<string[]>().notNull(),
    nextAction: text("nextAction"),
    dueAt: timestamp("dueAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("tasks_user_status_idx").on(table.userId, table.status)],
);

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["planning", "active", "blocked", "completed", "archived"])
      .default("planning")
      .notNull(),
    milestones: json("milestones").$type<string[]>().notNull(),
    risks: json("risks").$type<string[]>().notNull(),
    dependencies: json("dependencies").$type<string[]>().notNull(),
    nextAction: text("nextAction"),
    targetDate: timestamp("targetDate"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("projects_user_status_idx").on(table.userId, table.status)],
);

export const skills = mysqlTable(
  "skills",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 96 }).notNull(),
    proficiency: int("proficiency").notNull(),
    evidence: text("evidence"),
    nextAction: text("nextAction"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("skills_user_category_idx").on(table.userId, table.category)],
);

export const learningPlans = mysqlTable(
  "learning_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    topic: varchar("topic", { length: 240 }).notNull(),
    status: mysqlEnum("status", ["planning", "active", "reviewing", "mastered", "archived"])
      .default("planning")
      .notNull(),
    objectives: json("objectives").$type<string[]>().notNull(),
    activeRecall: json("activeRecall").$type<string[]>().notNull(),
    quizPrompts: json("quizPrompts").$type<string[]>().notNull(),
    revisionSchedule: json("revisionSchedule").$type<string[]>().notNull(),
    masteryEvidence: json("masteryEvidence").$type<string[]>().notNull(),
    nextReviewAt: timestamp("nextReviewAt"),
    lastReviewedAt: timestamp("lastReviewedAt"),
    reviewCount: int("reviewCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("learning_plans_user_status_idx").on(table.userId, table.status)],
);

export const examPlans = mysqlTable(
  "exam_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    examDate: timestamp("examDate"),
    status: mysqlEnum("status", ["planning", "preparing", "completed", "archived"])
      .default("planning")
      .notNull(),
    syllabus: json("syllabus").$type<string[]>().notNull(),
    practiceTests: json("practiceTests").$type<string[]>().notNull(),
    errorAnalysis: json("errorAnalysis").$type<string[]>().notNull(),
    revisionPlan: json("revisionPlan").$type<string[]>().notNull(),
    masteryEvidence: json("masteryEvidence").$type<string[]>().notNull(),
    nextAction: text("nextAction"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("exam_plans_user_status_idx").on(table.userId, table.status)],
);

export const memories = mysqlTable(
  "memories",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    category: mysqlEnum("category", ["profile", "goal", "preference", "decision", "mistake", "knowledge", "learning", "research", "other"])
      .default("other")
      .notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    content: text("content").notNull(),
    sourceType: mysqlEnum("sourceType", ["user", "assistant", "research"]).default("user").notNull(),
    sourceUrl: varchar("sourceUrl", { length: 2048 }),
    confidence: int("confidence").default(100).notNull(),
    isSensitive: boolean("isSensitive").default(false).notNull(),
    status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("memories_user_status_idx").on(table.userId, table.status)],
);

export type ResearchSource = { title: string; url: string; note?: string };
export const researchRecords = mysqlTable(
  "research_records",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    status: mysqlEnum("status", ["collecting", "cross_checking", "synthesized", "archived"])
      .default("collecting")
      .notNull(),
    sources: json("sources").$type<ResearchSource[]>().notNull(),
    retrievedFacts: json("retrievedFacts").$type<string[]>().notNull(),
    generatedReasoning: text("generatedReasoning"),
    crossCheckNotes: text("crossCheckNotes"),
    uncertainty: text("uncertainty"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("research_records_user_status_idx").on(table.userId, table.status)],
);

export const contentPlans = mysqlTable(
  "content_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    channel: varchar("channel", { length: 120 }),
    status: mysqlEnum("status", ["idea", "researching", "drafting", "ready", "published", "archived"])
      .default("idea")
      .notNull(),
    audience: text("audience"),
    hook: text("hook"),
    outline: json("outline").$type<string[]>().notNull(),
    productionPlan: json("productionPlan").$type<string[]>().notNull(),
    nextAction: text("nextAction"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("content_plans_user_status_idx").on(table.userId, table.status)],
);

export const chatMessages = mysqlTable(
  "chat_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    specialist: varchar("specialist", { length: 64 }),
    retrievedFacts: json("retrievedFacts").$type<string[]>().notNull(),
    generatedReasoning: text("generatedReasoning"),
    citations: json("citations").$type<ResearchSource[]>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("chat_messages_user_created_idx").on(table.userId, table.createdAt)],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 160 }).notNull(),
    specialist: varchar("specialist", { length: 64 }),
    permissionLevel: mysqlEnum("permissionLevel", ["read_only", "local_write", "confirmation_required"])
      .notNull(),
    approvalStatus: mysqlEnum("approvalStatus", ["not_required", "pending", "approved", "denied", "completed", "failed"])
      .default("not_required")
      .notNull(),
    toolName: varchar("toolName", { length: 120 }),
    requestSummary: text("requestSummary").notNull(),
    resultSummary: text("resultSummary"),
    failureDetails: text("failureDetails"),
    nextAction: text("nextAction"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("audit_logs_user_created_idx").on(table.userId, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

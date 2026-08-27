CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(160) NOT NULL,
	`specialist` varchar(64),
	`permissionLevel` enum('read_only','local_write','confirmation_required') NOT NULL,
	`approvalStatus` enum('not_required','pending','approved','denied','completed','failed') NOT NULL DEFAULT 'not_required',
	`toolName` varchar(120),
	`requestSummary` text NOT NULL,
	`resultSummary` text,
	`failureDetails` text,
	`nextAction` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`specialist` varchar(64),
	`retrievedFacts` json NOT NULL,
	`generatedReasoning` text,
	`citations` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`channel` varchar(120),
	`status` enum('idea','researching','drafting','ready','published','archived') NOT NULL DEFAULT 'idea',
	`audience` text,
	`hook` text,
	`outline` json NOT NULL,
	`productionPlan` json NOT NULL,
	`nextAction` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`examDate` timestamp,
	`status` enum('planning','preparing','completed','archived') NOT NULL DEFAULT 'planning',
	`syllabus` json NOT NULL,
	`practiceTests` json NOT NULL,
	`errorAnalysis` json NOT NULL,
	`revisionPlan` json NOT NULL,
	`masteryEvidence` json NOT NULL,
	`nextAction` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exam_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`horizon` enum('daily','weekly','monthly','quarterly','long_term') NOT NULL DEFAULT 'quarterly',
	`status` enum('active','paused','achieved','archived') NOT NULL DEFAULT 'active',
	`successMetric` text,
	`targetDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`topic` varchar(240) NOT NULL,
	`status` enum('planning','active','reviewing','mastered','archived') NOT NULL DEFAULT 'planning',
	`objectives` json NOT NULL,
	`activeRecall` json NOT NULL,
	`quizPrompts` json NOT NULL,
	`revisionSchedule` json NOT NULL,
	`masteryEvidence` json NOT NULL,
	`nextReviewAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('profile','goal','preference','decision','mistake','knowledge','learning','research','other') NOT NULL DEFAULT 'other',
	`title` varchar(240) NOT NULL,
	`content` text NOT NULL,
	`sourceType` enum('user','assistant','research') NOT NULL DEFAULT 'user',
	`sourceUrl` varchar(2048),
	`confidence` int NOT NULL DEFAULT 100,
	`isSensitive` boolean NOT NULL DEFAULT false,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`version` varchar(48) NOT NULL,
	`phase` varchar(96) NOT NULL,
	`currentTask` text NOT NULL,
	`completed` json NOT NULL,
	`inProgress` json NOT NULL,
	`blocked` json NOT NULL,
	`failedTests` json NOT NULL,
	`nextAction` text NOT NULL,
	`completionPercent` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_states_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`status` enum('planning','active','blocked','completed','archived') NOT NULL DEFAULT 'planning',
	`milestones` json NOT NULL,
	`risks` json NOT NULL,
	`dependencies` json NOT NULL,
	`nextAction` text,
	`targetDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` text NOT NULL,
	`status` enum('collecting','cross_checking','synthesized','archived') NOT NULL DEFAULT 'collecting',
	`sources` json NOT NULL,
	`retrievedFacts` json NOT NULL,
	`generatedReasoning` text,
	`crossCheckNotes` text,
	`uncertainty` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(96) NOT NULL,
	`proficiency` int NOT NULL,
	`evidence` text,
	`nextAction` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sparkle_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(140),
	`headline` text,
	`preferences` json NOT NULL,
	`defaultPermission` enum('read_only','confirm_writes','guided_execution') NOT NULL DEFAULT 'read_only',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sparkle_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `sparkle_profiles_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalId` int,
	`projectId` int,
	`title` varchar(240) NOT NULL,
	`description` text,
	`status` enum('not_started','in_progress','blocked','completed') NOT NULL DEFAULT 'not_started',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`dependencies` json NOT NULL,
	`nextAction` text,
	`dueAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_plans` ADD CONSTRAINT `content_plans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_plans` ADD CONSTRAINT `exam_plans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_plans` ADD CONSTRAINT `learning_plans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memories` ADD CONSTRAINT `memories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_states` ADD CONSTRAINT `project_states_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `research_records` ADD CONSTRAINT `research_records_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skills` ADD CONSTRAINT `skills_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sparkle_profiles` ADD CONSTRAINT `sparkle_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_logs_user_created_idx` ON `audit_logs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `chat_messages_user_created_idx` ON `chat_messages` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `content_plans_user_status_idx` ON `content_plans` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `exam_plans_user_status_idx` ON `exam_plans` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `goals_user_status_idx` ON `goals` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `learning_plans_user_status_idx` ON `learning_plans` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `memories_user_status_idx` ON `memories` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `projects_user_status_idx` ON `projects` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `research_records_user_status_idx` ON `research_records` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `skills_user_category_idx` ON `skills` (`userId`,`category`);--> statement-breakpoint
CREATE INDEX `tasks_user_status_idx` ON `tasks` (`userId`,`status`);
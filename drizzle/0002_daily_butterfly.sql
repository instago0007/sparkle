ALTER TABLE `learning_plans` ADD `lastReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `learning_plans` ADD `reviewCount` int DEFAULT 0 NOT NULL;
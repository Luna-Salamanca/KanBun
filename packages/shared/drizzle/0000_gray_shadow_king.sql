CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`avatar` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `columns` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`title` text NOT NULL,
	`order_index` text NOT NULL,
	`color` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`column_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`order_index` text NOT NULL,
	`assignee_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `boards_owner_idx` ON `boards` (`owner_id`);--> statement-breakpoint
CREATE INDEX `cards_column_idx` ON `cards` (`column_id`);--> statement-breakpoint
CREATE INDEX `cards_order_idx` ON `cards` (`column_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `cards_assignee_idx` ON `cards` (`assignee_id`);--> statement-breakpoint
CREATE INDEX `columns_board_idx` ON `columns` (`board_id`);--> statement-breakpoint
CREATE INDEX `columns_order_idx` ON `columns` (`board_id`,`order_index`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);
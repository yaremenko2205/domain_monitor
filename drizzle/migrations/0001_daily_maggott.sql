CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `domains` ADD `owner_account` text;--> statement-breakpoint
ALTER TABLE `domains` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `domains` ADD `payment_method_expiry` text;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;
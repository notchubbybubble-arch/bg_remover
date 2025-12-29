CREATE TABLE `images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalUrl` text NOT NULL,
	`originalKey` text NOT NULL,
	`processedUrl` text,
	`processedKey` text,
	`status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
	`width` int,
	`height` int,
	`fileSize` int,
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `images` ADD CONSTRAINT `images_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
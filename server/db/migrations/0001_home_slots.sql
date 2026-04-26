CREATE TABLE `home_slots` (
	`slot_key` text PRIMARY KEY NOT NULL,
	`artwork_id` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade
);

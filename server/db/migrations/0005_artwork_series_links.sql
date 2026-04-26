CREATE TABLE `artwork_series_links` (
	`artwork_id` text NOT NULL,
	`series_id` text NOT NULL,
	`is_primary` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY (`artwork_id`, `series_id`),
	FOREIGN KEY (`artwork_id`) REFERENCES `artworks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_series_links_primary_unique` ON `artwork_series_links` (`artwork_id`) WHERE `is_primary` = 1;
--> statement-breakpoint
INSERT INTO `artwork_series_links` (`artwork_id`, `series_id`, `is_primary`, `sort_order`)
SELECT `id`, `series_id`, 1, `sort_order` FROM `artworks`;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_artworks` (
	`id` text PRIMARY KEY NOT NULL,
	`title_zh` text DEFAULT '' NOT NULL,
	`title_en` text DEFAULT '' NOT NULL,
	`title_ja` text DEFAULT '' NOT NULL,
	`description_zh` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`description_ja` text DEFAULT '' NOT NULL,
	`storage_key` text NOT NULL,
	`url` text NOT NULL,
	`mime_type` text DEFAULT 'image/jpeg' NOT NULL,
	`width` integer DEFAULT 0 NOT NULL,
	`height` integer DEFAULT 0 NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`object_position` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_artworks` (
	`id`, `title_zh`, `title_en`, `title_ja`,
	`description_zh`, `description_en`, `description_ja`,
	`storage_key`, `url`, `mime_type`,
	`width`, `height`, `size_bytes`,
	`object_position`, `created_at`
)
SELECT
	`id`, `title_zh`, `title_en`, `title_ja`,
	`description_zh`, `description_en`, `description_ja`,
	`storage_key`, `url`, `mime_type`,
	`width`, `height`, `size_bytes`,
	`object_position`, `created_at`
FROM `artworks`;
--> statement-breakpoint
DROP TABLE `artworks`;
--> statement-breakpoint
ALTER TABLE `__new_artworks` RENAME TO `artworks`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;

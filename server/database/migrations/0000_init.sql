CREATE TABLE `artworks` (
	`id` text PRIMARY KEY NOT NULL,
	`series_id` text NOT NULL,
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
	`featured` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`icon` text DEFAULT 'lucide:image' NOT NULL,
	`label_zh` text NOT NULL,
	`label_en` text NOT NULL,
	`label_ja` text NOT NULL,
	`description_zh` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`description_ja` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`category_id` text NOT NULL,
	`name_zh` text NOT NULL,
	`name_en` text NOT NULL,
	`name_ja` text NOT NULL,
	`description_zh` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`description_ja` text DEFAULT '' NOT NULL,
	`cover_artwork_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `series_slug_unique` ON `series` (`slug`);
--> statement-breakpoint
INSERT INTO `categories` (`id`, `icon`, `label_zh`, `label_en`, `label_ja`, `description_zh`, `description_en`, `description_ja`, `sort_order`) VALUES
('game-fanart', 'lucide:gamepad-2', '游戏同人', 'Game Fanart', 'ゲーム同人', '游戏角色的同人插画与角色诠释。', 'Fan illustrations and character studies for game titles.', 'ゲーム作品のファンアートとキャラクター表現。', 10),
('anime-fanart', 'lucide:film', '动漫同人', 'Anime Fanart', 'アニメ同人', '动画、漫画与虚拟歌手相关作品。', 'Works inspired by anime, manga, and virtual singers.', 'アニメ、漫画、バーチャルシンガー関連の作品。', 20),
('original-oc', 'lucide:sparkles', '原创 OC 角色', 'Original OC', 'オリジナル OC', '原创角色、生日图与个人创作。', 'Original characters, birthday pieces, and personal works.', 'オリジナルキャラクター、誕生日絵、個人制作。', 30),
('commercial-commission', 'lucide:briefcase-business', '商单或委托', 'Commercial / Commission', '商業・依頼', '商稿、委托与可公开展示的样例。', 'Commercial work, commissions, and public samples.', '商業案件、依頼作品、公開可能なサンプル。', 40);
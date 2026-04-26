INSERT INTO `categories` (
  `id`, `icon`, `label_zh`, `label_en`, `label_ja`,
  `description_zh`, `description_en`, `description_ja`, `sort_order`
)
VALUES (
  'fan-works', 'lucide:palette', '同人创作', 'Fan Works', 'ファンアート',
  '游戏、动画漫画、虚拟歌手等作品的二次创作。',
  'Fan works inspired by games, anime, manga, virtual singers, and other titles.',
  'ゲーム、アニメ、漫画、ボカロなどを題材にしたファンアート。', 10
)
ON CONFLICT(`id`) DO UPDATE SET
  `icon` = excluded.`icon`,
  `label_zh` = excluded.`label_zh`,
  `label_en` = excluded.`label_en`,
  `label_ja` = excluded.`label_ja`,
  `description_zh` = excluded.`description_zh`,
  `description_en` = excluded.`description_en`,
  `description_ja` = excluded.`description_ja`,
  `sort_order` = excluded.`sort_order`;
--> statement-breakpoint
UPDATE `series`
SET `category_id` = 'fan-works'
WHERE `category_id` IN ('game-fanart', 'anime-fanart');
--> statement-breakpoint
UPDATE `categories`
SET `sort_order` = 20
WHERE `id` = 'original-oc';
--> statement-breakpoint
UPDATE `categories`
SET `sort_order` = 30
WHERE `id` = 'commercial-commission';
--> statement-breakpoint
INSERT OR IGNORE INTO `home_slots` (`slot_key`, `artwork_id`, `position`, `updated_at`)
SELECT 'category.fan-works', `artwork_id`, `position`, `updated_at`
FROM `home_slots`
WHERE `slot_key` IN ('category.game-fanart', 'category.anime-fanart')
ORDER BY CASE `slot_key`
  WHEN 'category.game-fanart' THEN 0
  ELSE 1
END
LIMIT 1;
--> statement-breakpoint
DELETE FROM `home_slots`
WHERE `slot_key` IN ('category.game-fanart', 'category.anime-fanart');
--> statement-breakpoint
DELETE FROM `categories`
WHERE `id` IN ('game-fanart', 'anime-fanart');

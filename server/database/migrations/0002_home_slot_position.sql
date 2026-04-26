ALTER TABLE `home_slots` ADD `position` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `home_slots` SET `position` = CAST(SUBSTR(`slot_key`, 10) AS INTEGER) WHERE `slot_key` LIKE 'selected.%';
-- Adds category, tags, pin, and soft-delete support to notes table
ALTER TABLE notes ADD COLUMN category TEXT DEFAULT 'General';
ALTER TABLE notes ADD COLUMN tags TEXT[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT false;
ALTER TABLE notes ADD COLUMN is_deleted BOOLEAN DEFAULT false;

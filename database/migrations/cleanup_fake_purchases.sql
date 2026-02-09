-- Remove all fake purchase data
-- This script deletes all purchases from the database

BEGIN;

-- Delete all purchases
DELETE FROM purchases;

-- Reset the sequence (optional, for PostgreSQL)
-- This resets the ID counter back to 1
ALTER SEQUENCE IF EXISTS purchases_id_seq RESTART WITH 1;

COMMIT;

-- Verify deletion
SELECT COUNT(*) as remaining_purchases FROM purchases;

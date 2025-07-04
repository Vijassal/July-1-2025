-- Migration: Backfill owners into account_instance_users
-- Inserts a row for each owner in account_instances if not already present in account_instance_users

INSERT INTO account_instance_users (account_instance_id, user_id, role, status, is_owner)
SELECT
  ai.id,
  ai.owner_user_id,
  'owner',
  'active',
  TRUE
FROM account_instances ai
LEFT JOIN account_instance_users aiu
  ON ai.id = aiu.account_instance_id AND ai.owner_user_id = aiu.user_id
WHERE aiu.id IS NULL; 
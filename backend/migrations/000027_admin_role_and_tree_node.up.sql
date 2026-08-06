-- 000027_admin_role_and_tree_node.up.sql
-- H4 fix: the seeded admin (000002) was inserted before the `role` column
-- existed (added in 000005 with DEFAULT 'user'), so it can never reach admin
-- routes. Also, no invite_tree root node was created for it, so any user who
-- registers under its invite code fails the "upline not found" lookup in
-- InsertNode. This migration repairs both for existing and fresh databases.

UPDATE users
SET role = 'super_admin'
WHERE email = 'admin@musica.com'
  AND invite_code = 'ADMIN001'
  AND role = 'user';

INSERT INTO invite_tree (user_id, upline_id, level, path)
SELECT u.id, NULL, 1, text2ltree(replace(u.id::text, '-', '_'))
FROM users u
WHERE u.email = 'admin@musica.com'
  AND u.invite_code = 'ADMIN001'
  AND NOT EXISTS (SELECT 1 FROM invite_tree it WHERE it.user_id = u.id);

-- 000027_admin_role_and_tree_node.down.sql

DELETE FROM invite_tree it
USING users u
WHERE it.user_id = u.id
  AND u.email = 'admin@musica.com'
  AND u.invite_code = 'ADMIN001';

UPDATE users
SET role = 'user'
WHERE email = 'admin@musica.com'
  AND invite_code = 'ADMIN001';

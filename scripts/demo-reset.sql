-- Borra los datos de las cuentas demo (*.demo@inkluedu.mx) sin borrar las cuentas.
-- Uso: docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < scripts/demo-reset.sql
DELETE FROM progress WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%.demo@inkluedu.mx');
DELETE FROM student_badges WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%.demo@inkluedu.mx');
DELETE FROM classroom_members WHERE classroom_id IN (SELECT c.id FROM classrooms c JOIN users u ON u.id = c.teacher_id WHERE u.email LIKE '%.demo@inkluedu.mx');
DELETE FROM assignments WHERE classroom_id IN (SELECT c.id FROM classrooms c JOIN users u ON u.id = c.teacher_id WHERE u.email LIKE '%.demo@inkluedu.mx');
DELETE FROM classrooms WHERE teacher_id IN (SELECT id FROM users WHERE email LIKE '%.demo@inkluedu.mx');
DELETE FROM teacher_activities WHERE teacher_id IN (SELECT id FROM users WHERE email LIKE '%.demo@inkluedu.mx');

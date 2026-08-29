-- seed-skills-interests.sql
-- Master data skills & interests. Idempotent: aman dijalankan berulang
-- (kolom `name` unique, konflik di-skip).
-- id & created_at memakai default kolom (gen_random_uuid(), now()).

insert into public.skills (name) values
  ('HTML'),
  ('CSS'),
  ('JavaScript'),
  ('TypeScript'),
  ('React'),
  ('Next.js'),
  ('Tailwind'),
  ('Node.js'),
  ('Python'),
  ('PostgreSQL'),
  ('Git'),
  ('UI/UX'),
  ('Figma'),
  ('Docker'),
  ('AWS'),
  ('GraphQL'),
  ('Prisma'),
  ('Supabase'),
  ('Firebase'),
  ('Linux')
on conflict (name) do nothing;

insert into public.interests (name) values
  ('Web Development'),
  ('Frontend'),
  ('Backend'),
  ('Full Stack'),
  ('Mobile Development'),
  ('UI/UX Design'),
  ('Data Science'),
  ('DevOps'),
  ('Game Development'),
  ('AI/ML'),
  ('Cloud Computing'),
  ('Cybersecurity')
on conflict (name) do nothing;

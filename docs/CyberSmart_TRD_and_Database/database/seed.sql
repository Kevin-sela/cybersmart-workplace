-- Minimal seed: course shell, four modules and objectives O1–O7 from the report.
-- Lesson content, quiz questions and distractors are authored by the group.
INSERT INTO courses (slug, title, description, audience, duration_weeks, is_published)
VALUES ('cybersmart-workplace', 'CyberSmart Workplace: Practical Cybersecurity Awareness',
        'A four-week, practice-based course on recognising and responding to common workplace cyber threats.',
        'Working professionals with mixed cybersecurity knowledge', 4, true);

WITH c AS (SELECT id FROM courses WHERE slug = 'cybersmart-workplace')
INSERT INTO modules (course_id, week_number, title, position)
SELECT c.id, v.w, v.t, v.w FROM c,
 (VALUES (1,'Recognise threats'),(2,'Choose safe actions'),(3,'Respond and collaborate'),(4,'Review and demonstrate')) AS v(w,t);

WITH c AS (SELECT id FROM courses WHERE slug = 'cybersmart-workplace')
INSERT INTO learning_objectives (course_id, code, description, level, due_week)
SELECT c.id, v.code, v.d, v.l::bloom_level, v.w FROM c,
 (VALUES
  ('O1','Identify at least four of five common phishing indicators in a sample message.','analyse',1),
  ('O2','Distinguish a suspicious link from a safer destination in at least four of five examples.','analyse',1),
  ('O3','Select the appropriate next step for at least four of five workplace security scenarios.','apply',2),
  ('O4','Describe at least three safe account-protection practices, including strong unique passwords and MFA.','understand',2),
  ('O5','Contribute at least one evidence-based point to the moderated scenario discussion.','evaluate',3),
  ('O6','Submit a group response checklist with at least five accurate steps.','create',3),
  ('O7','Score at least 80% on the ten-question course quiz after reviewing feedback.','apply',4)
 ) AS v(code,d,l,w);

WITH c AS (SELECT id FROM courses WHERE slug = 'cybersmart-workplace')
INSERT INTO quizzes (course_id, title, pass_mark_percent, is_final, is_published)
SELECT c.id, 'Final course quiz (10 questions)', 80, true, false FROM c;

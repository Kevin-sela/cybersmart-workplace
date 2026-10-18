-- =====================================================================
-- CyberSmart Workplace – PostgreSQL schema (v1.0, proposed)
-- Target: PostgreSQL 15+. Run once on an empty database.
-- Conventions: UUID primary keys, snake_case, timestamptz in UTC,
-- every table has created_at; mutable tables have updated_at.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email

-- ---------- Enumerated types ----------
CREATE TYPE user_role        AS ENUM ('learner', 'instructor', 'admin');
CREATE TYPE content_type     AS ENUM ('text', 'image', 'video', 'scenario', 'download');
CREATE TYPE progress_status  AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'withdrawn');
CREATE TYPE bloom_level      AS ENUM ('remember', 'understand', 'apply', 'analyse', 'evaluate', 'create');
CREATE TYPE survey_qtype     AS ENUM ('likert', 'yes_no_partly', 'open_text');
CREATE TYPE support_status   AS ENUM ('open', 'in_progress', 'resolved');

-- ---------- Shared trigger: keep updated_at current ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1. Identity
-- =====================================================================
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext NOT NULL UNIQUE,
  full_name      varchar(120) NOT NULL,
  password_hash  text NOT NULL,                       -- Argon2id/bcrypt hash only
  role           user_role NOT NULL DEFAULT 'learner',
  is_active      boolean NOT NULL DEFAULT true,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,                   -- store hash, never the raw token
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- =====================================================================
-- 2. Course structure
-- =====================================================================
CREATE TABLE courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            varchar(80) NOT NULL UNIQUE,
  title           varchar(160) NOT NULL,
  description     text NOT NULL,
  audience        text,
  duration_weeks  smallint NOT NULL DEFAULT 4 CHECK (duration_weeks BETWEEN 1 AND 52),
  is_published    boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE learning_objectives (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  code         varchar(8) NOT NULL,                   -- e.g. O1 … O7
  description  text NOT NULL,
  level        bloom_level,
  due_week     smallint CHECK (due_week BETWEEN 1 AND 52),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, code)
);

CREATE TABLE modules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  week_number  smallint NOT NULL CHECK (week_number >= 1),
  title        varchar(160) NOT NULL,
  summary      text,
  position     smallint NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, position)
);
CREATE INDEX idx_modules_course ON modules(course_id);

CREATE TABLE lessons (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id          uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug               varchar(80) NOT NULL,
  title              varchar(160) NOT NULL,
  content_type       content_type NOT NULL DEFAULT 'text',
  body               text,                            -- Markdown/HTML text-first content
  media_url          text,                            -- compressed media, optional
  transcript         text,                            -- required when content_type = 'video'
  alt_text           text,                            -- required when content_type = 'image'
  estimated_minutes  smallint CHECK (estimated_minutes > 0),
  position           smallint NOT NULL,
  is_published       boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, slug),
  UNIQUE (module_id, position),
  CHECK (content_type <> 'video' OR transcript IS NOT NULL),
  CHECK (content_type <> 'image' OR alt_text IS NOT NULL)
);
CREATE INDEX idx_lessons_module ON lessons(module_id);

-- =====================================================================
-- 3. Enrolment and progress
-- =====================================================================
CREATE TABLE enrollments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id     uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status        enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  UNIQUE (user_id, course_id)
);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

CREATE TABLE lesson_progress (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id       uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id           uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status              progress_status NOT NULL DEFAULT 'not_started',
  started_at          timestamptz,
  completed_at        timestamptz,
  time_spent_seconds  integer NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, lesson_id)
);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- =====================================================================
-- 4. Assessment
-- =====================================================================
CREATE TABLE quizzes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id         uuid REFERENCES modules(id) ON DELETE SET NULL,
  title             varchar(160) NOT NULL,
  instructions      text,
  pass_mark_percent smallint NOT NULL DEFAULT 80 CHECK (pass_mark_percent BETWEEN 0 AND 100),
  is_final          boolean NOT NULL DEFAULT false,
  is_published      boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quizzes_course ON quizzes(course_id);

CREATE TABLE questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  objective_id  uuid REFERENCES learning_objectives(id) ON DELETE SET NULL,
  prompt        text NOT NULL,
  explanation   text NOT NULL,                        -- shown after answering
  position      smallint NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, position)
);
CREATE INDEX idx_questions_objective ON questions(objective_id);

CREATE TABLE answer_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text         text NOT NULL,
  is_correct   boolean NOT NULL DEFAULT false,
  feedback     text,
  position     smallint NOT NULL,
  UNIQUE (question_id, position)
);
-- Exactly one correct option per question (single-answer MCQ)
CREATE UNIQUE INDEX uq_one_correct_option ON answer_options(question_id) WHERE is_correct;

CREATE TABLE quiz_attempts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id          uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number   smallint NOT NULL CHECK (attempt_number >= 1),
  correct_count    smallint NOT NULL DEFAULT 0,
  total_questions  smallint NOT NULL DEFAULT 0,
  score_percent    numeric(5,2) NOT NULL DEFAULT 0 CHECK (score_percent BETWEEN 0 AND 100),
  passed           boolean NOT NULL DEFAULT false,
  started_at       timestamptz NOT NULL DEFAULT now(),
  submitted_at     timestamptz,
  UNIQUE (quiz_id, user_id, attempt_number)
);
CREATE INDEX idx_attempts_user ON quiz_attempts(user_id);

CREATE TABLE attempt_answers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id          uuid NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id         uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id  uuid REFERENCES answer_options(id) ON DELETE SET NULL,
  is_correct          boolean NOT NULL,
  UNIQUE (attempt_id, question_id)
);

-- =====================================================================
-- 5. Collaboration: discussion and group task
-- =====================================================================
CREATE TABLE discussion_threads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id   uuid REFERENCES modules(id) ON DELETE SET NULL,
  author_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       varchar(200) NOT NULL,
  body        text NOT NULL,
  is_hidden   boolean NOT NULL DEFAULT false,         -- moderator action
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_threads_course ON discussion_threads(course_id, created_at DESC);

CREATE TABLE discussion_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       uuid NOT NULL REFERENCES discussion_threads(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_post_id  uuid REFERENCES discussion_posts(id) ON DELETE CASCADE,
  body            text NOT NULL,
  is_hidden       boolean NOT NULL DEFAULT false,
  flagged_count   integer NOT NULL DEFAULT 0 CHECK (flagged_count >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_thread ON discussion_posts(thread_id, created_at);

CREATE TABLE group_tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id   uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title       varchar(160) NOT NULL,
  brief       text NOT NULL,
  rubric      jsonb NOT NULL DEFAULT '[]'::jsonb,     -- [{"criterion":"…","max_points":n}]
  due_at      timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES group_tasks(id) ON DELETE CASCADE,
  name        varchar(80) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, name)
);

CREATE TABLE group_members (
  group_id   uuid NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX idx_group_members_user ON group_members(user_id);

CREATE TABLE task_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      uuid NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
  submitted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  content       jsonb NOT NULL,                       -- checklist steps
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  score         numeric(5,2) CHECK (score BETWEEN 0 AND 100),
  feedback      text,
  graded_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  graded_at     timestamptz
);
CREATE INDEX idx_submissions_group ON task_submissions(group_id);

-- =====================================================================
-- 6. Evaluation: survey and support
-- =====================================================================
CREATE TABLE surveys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       varchar(160) NOT NULL,
  is_open     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE survey_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  prompt        text NOT NULL,
  question_type survey_qtype NOT NULL,
  position      smallint NOT NULL,
  UNIQUE (survey_id, position)
);

-- Anonymous by design: no user_id. A separate table records who has
-- responded (to stop duplicates) without linking identity to answers.
CREATE TABLE survey_responses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  submitted_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE survey_participation (
  survey_id  uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (survey_id, user_id)
);

CREATE TABLE survey_answers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id  uuid NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id  uuid NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  likert_value smallint CHECK (likert_value BETWEEN 1 AND 5),
  choice_value varchar(20),
  text_value   text,
  UNIQUE (response_id, question_id)
);

CREATE TABLE support_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  category    varchar(40) NOT NULL CHECK (category IN ('technical','learning','accessibility','assessment')),
  message     text NOT NULL,
  status      support_status NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- =====================================================================
-- 7. Triggers
-- =====================================================================
CREATE TRIGGER trg_users_updated    BEFORE UPDATE ON users              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_courses_updated  BEFORE UPDATE ON courses            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_modules_updated  BEFORE UPDATE ON modules            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lessons_updated  BEFORE UPDATE ON lessons            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_quizzes_updated  BEFORE UPDATE ON quizzes            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_threads_updated  BEFORE UPDATE ON discussion_threads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_posts_updated    BEFORE UPDATE ON discussion_posts   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON lesson_progress    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- 8. Instructor reporting views (aggregated; no learner PII)
-- =====================================================================
CREATE VIEW v_course_completion AS
SELECT c.id AS course_id,
       c.title,
       COUNT(DISTINCT e.id)                                         AS enrolled,
       COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')   AS completed,
       ROUND(100.0 * COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')
             / NULLIF(COUNT(DISTINCT e.id), 0), 1)                  AS completion_percent
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title;

CREATE VIEW v_quiz_summary AS
SELECT q.id AS quiz_id,
       q.title,
       COUNT(a.id)                                   AS attempts,
       COUNT(DISTINCT a.user_id)                     AS learners,
       ROUND(AVG(a.score_percent), 1)                AS avg_score_percent,
       COUNT(*) FILTER (WHERE a.passed)              AS passed_attempts
FROM quizzes q
LEFT JOIN quiz_attempts a ON a.quiz_id = q.id AND a.submitted_at IS NOT NULL
GROUP BY q.id, q.title;

CREATE VIEW v_question_difficulty AS
SELECT qu.id AS question_id,
       qu.quiz_id,
       qu.prompt,
       COUNT(aa.id)                                                         AS answered,
       ROUND(100.0 * COUNT(*) FILTER (WHERE aa.is_correct) / NULLIF(COUNT(aa.id), 0), 1) AS correct_percent
FROM questions qu
LEFT JOIN attempt_answers aa ON aa.question_id = qu.id
GROUP BY qu.id, qu.quiz_id, qu.prompt;

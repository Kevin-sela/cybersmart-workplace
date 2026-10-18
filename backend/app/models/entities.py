from datetime import datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, JSON, Numeric, SmallInteger, String, Text, Uuid, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(StrEnum):
    LEARNER = "learner"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"


class ContentType(StrEnum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    SCENARIO = "scenario"
    DOWNLOAD = "download"


class ProgressStatus(StrEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class EnrollmentStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"


class BloomLevel(StrEnum):
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYSE = "analyse"
    EVALUATE = "evaluate"
    CREATE = "create"


class SurveyQuestionType(StrEnum):
    LIKERT = "likert"
    YES_NO_PARTLY = "yes_no_partly"
    OPEN_TEXT = "open_text"


class SupportStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


def db_enum(enum_class: type[StrEnum], name: str) -> Enum:
    return Enum(enum_class, name=name, values_callable=lambda members: [member.value for member in members])


json_type = JSON().with_variant(JSONB(), "postgresql")


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[UserRole] = mapped_column(db_enum(UserRole, "user_role"), default=UserRole.LEARNER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    bio: Mapped[str | None] = mapped_column(String(280))
    locale: Mapped[str] = mapped_column(String(16), default="en", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class OAuthIdentity(Base):
    __tablename__ = "oauth_identities"
    __table_args__ = (UniqueConstraint("provider", "provider_subject"), UniqueConstraint("user_id", "provider"))

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    audience: Mapped[str | None] = mapped_column(Text)
    duration_weeks: Mapped[int] = mapped_column(SmallInteger, default=4, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))


class LearningObjective(Base):
    __tablename__ = "learning_objectives"
    __table_args__ = (UniqueConstraint("course_id", "code"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(8), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[BloomLevel | None] = mapped_column(db_enum(BloomLevel, "bloom_level"))
    due_week: Mapped[int | None] = mapped_column(SmallInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Module(Base, TimestampMixin):
    __tablename__ = "modules"
    __table_args__ = (UniqueConstraint("course_id", "position"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    week_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("module_id", "slug"), UniqueConstraint("module_id", "position"))

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    module_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    content_type: Mapped[ContentType] = mapped_column(db_enum(ContentType, "content_type"), default=ContentType.TEXT)
    body: Mapped[str | None] = mapped_column(Text)
    media_url: Mapped[str | None] = mapped_column(Text)
    transcript: Mapped[str | None] = mapped_column(Text)
    alt_text: Mapped[str | None] = mapped_column(Text)
    estimated_minutes: Mapped[int | None] = mapped_column(SmallInteger)
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("user_id", "course_id"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    course_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    status: Mapped[EnrollmentStatus] = mapped_column(db_enum(EnrollmentStatus, "enrollment_status"), default=EnrollmentStatus.ACTIVE)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("enrollment_id", "lesson_id"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    enrollment_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("enrollments.id", ondelete="CASCADE"))
    lesson_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    status: Mapped[ProgressStatus] = mapped_column(db_enum(ProgressStatus, "progress_status"), default=ProgressStatus.NOT_STARTED)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Quiz(Base, TimestampMixin):
    __tablename__ = "quizzes"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("modules.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text)
    pass_mark_percent: Mapped[int] = mapped_column(SmallInteger, default=80)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (UniqueConstraint("quiz_id", "position"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    quiz_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"))
    objective_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("learning_objectives.id", ondelete="SET NULL"), index=True)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AnswerOption(Base):
    __tablename__ = "answer_options"
    __table_args__ = (UniqueConstraint("question_id", "position"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    question_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"))
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    feedback: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (UniqueConstraint("quiz_id", "user_id", "attempt_number"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    quiz_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"))
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    attempt_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    correct_count: Mapped[int] = mapped_column(SmallInteger, default=0)
    total_questions: Mapped[int] = mapped_column(SmallInteger, default=0)
    score_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"
    __table_args__ = (UniqueConstraint("attempt_id", "question_id"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    attempt_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("quiz_attempts.id", ondelete="CASCADE"))
    question_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"))
    selected_option_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("answer_options.id", ondelete="SET NULL"))
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)


class DiscussionThread(Base):
    __tablename__ = "discussion_threads"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("modules.id", ondelete="SET NULL"))
    channel_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("discussion_channels.id", ondelete="SET NULL"), index=True)
    author_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class DiscussionChannel(Base):
    __tablename__ = "discussion_channels"
    __table_args__ = (UniqueConstraint("course_id", "slug"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("modules.id", ondelete="SET NULL"))
    slug: Mapped[str] = mapped_column(String(60), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(240), nullable=False)
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class DiscussionPost(Base):
    __tablename__ = "discussion_posts"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    thread_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("discussion_threads.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    parent_post_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("discussion_posts.id", ondelete="CASCADE"))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    flagged_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class GroupTask(Base):
    __tablename__ = "group_tasks"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    module_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    brief: Mapped[str] = mapped_column(Text, nullable=False)
    rubric: Mapped[list[dict[str, object]]] = mapped_column(json_type, default=list)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class TaskGroup(Base):
    __tablename__ = "task_groups"
    __table_args__ = (UniqueConstraint("task_id", "name"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    task_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("group_tasks.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class GroupMember(Base):
    __tablename__ = "group_members"

    group_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("task_groups.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class TaskSubmission(Base):
    __tablename__ = "task_submissions"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    group_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("task_groups.id", ondelete="CASCADE"), index=True)
    submitted_by: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    content: Mapped[dict[str, object]] = mapped_column(json_type, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    feedback: Mapped[str | None] = mapped_column(Text)
    graded_by: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    graded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Survey(Base):
    __tablename__ = "surveys"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    course_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    is_open: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"
    __table_args__ = (UniqueConstraint("survey_id", "position"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    survey_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"))
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[SurveyQuestionType] = mapped_column(db_enum(SurveyQuestionType, "survey_qtype"))
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    survey_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"))
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class SurveyParticipation(Base):
    __tablename__ = "survey_participation"

    survey_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"
    __table_args__ = (UniqueConstraint("response_id", "question_id"),)

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    response_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("survey_responses.id", ondelete="CASCADE"))
    question_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("survey_questions.id", ondelete="CASCADE"))
    likert_value: Mapped[int | None] = mapped_column(SmallInteger)
    choice_value: Mapped[str | None] = mapped_column(String(20))
    text_value: Mapped[str | None] = mapped_column(Text)


class SupportRequest(Base):
    __tablename__ = "support_requests"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SupportStatus] = mapped_column(db_enum(SupportStatus, "support_status"), default=SupportStatus.OPEN)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

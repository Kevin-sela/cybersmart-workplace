from datetime import datetime
from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.common import ApiSchema


class LessonRead(ApiSchema):
    id: UUID
    slug: str
    title: str
    content_type: str
    body: str | None
    transcript: str | None
    estimated_minutes: int | None
    position: int


class ModuleRead(ApiSchema):
    id: UUID
    week_number: int
    title: str
    summary: str | None
    position: int
    lessons: list[LessonRead]


class CourseRead(ApiSchema):
    id: UUID
    slug: str
    title: str
    description: str
    duration_weeks: int
    modules: list[ModuleRead]


class ProgressUpdate(ApiSchema):
    status: str = Field(pattern="^(in_progress|completed)$")
    time_spent_seconds: int = Field(default=0, ge=0, le=86400)


class ProgressItem(ApiSchema):
    lesson_id: UUID
    lesson_title: str
    module_week: int
    status: str
    completed_at: datetime | None


class ProgressRead(ApiSchema):
    completed_lessons: int
    total_lessons: int
    percent_complete: int
    items: list[ProgressItem]


class QuizOptionRead(ApiSchema):
    id: UUID
    text: str
    position: int


class QuizQuestionRead(ApiSchema):
    id: UUID
    prompt: str
    position: int
    options: list[QuizOptionRead]


class QuizRead(ApiSchema):
    id: UUID
    title: str
    instructions: str | None
    pass_mark_percent: int
    questions: list[QuizQuestionRead]


class QuizAnswerInput(ApiSchema):
    question_id: UUID
    selected_option_id: UUID


class QuizSubmit(ApiSchema):
    answers: list[QuizAnswerInput] = Field(min_length=1, max_length=30)

    @field_validator("answers")
    @classmethod
    def unique_questions(cls, value: list[QuizAnswerInput]) -> list[QuizAnswerInput]:
        if len({answer.question_id for answer in value}) != len(value):
            raise ValueError("Each question can only be answered once.")
        return value


class QuizFeedback(ApiSchema):
    question_id: UUID
    selected_option_id: UUID
    correct_option_id: UUID
    correct_answer: str
    is_correct: bool
    explanation: str
    answer_feedback: str | None


class QuizResult(ApiSchema):
    attempt_id: UUID
    correct_count: int
    total_questions: int
    score_percent: float
    passed: bool
    pass_mark_percent: int
    feedback: list[QuizFeedback]

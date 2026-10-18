from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import (
    AnswerOption, AttemptAnswer, Course, DiscussionChannel, DiscussionPost, DiscussionThread,
    Enrollment, EnrollmentStatus, GroupMember, GroupTask, Lesson, LessonProgress,
    Module, ProgressStatus, Question, Quiz, QuizAttempt, TaskGroup, TaskSubmission,
    User,
)


def list_courses(db: Session) -> list[Course]:
    return list(db.scalars(select(Course).where(Course.is_published.is_(True)).order_by(Course.title)))


def get_course(db: Session, slug: str) -> Course | None:
    return db.scalar(select(Course).where(Course.slug == slug, Course.is_published.is_(True)))


def list_modules(db: Session, course_id: UUID) -> list[Module]:
    return list(db.scalars(select(Module).where(Module.course_id == course_id).order_by(Module.position)))


def list_lessons(db: Session, module_id: UUID, *, published_only: bool = True) -> list[Lesson]:
    query = select(Lesson).where(Lesson.module_id == module_id)
    if published_only:
        query = query.where(Lesson.is_published.is_(True))
    return list(db.scalars(query.order_by(Lesson.position)))


def get_lesson(db: Session, slug: str) -> Lesson | None:
    return db.scalar(select(Lesson).where(Lesson.slug == slug, Lesson.is_published.is_(True)))


def get_enrollment(db: Session, user_id: UUID, course_id: UUID) -> Enrollment | None:
    return db.scalar(select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id))


def get_progress(db: Session, enrollment_id: UUID) -> list[tuple[Lesson, LessonProgress | None, Module]]:
    return list(db.execute(
        select(Lesson, LessonProgress, Module)
        .join(Module, Module.id == Lesson.module_id)
        .join(Enrollment, Enrollment.id == enrollment_id)
        .outerjoin(LessonProgress, (LessonProgress.lesson_id == Lesson.id) & (LessonProgress.enrollment_id == enrollment_id))
        .where(Lesson.is_published.is_(True), Module.course_id == Enrollment.course_id)
        .order_by(Module.position, Lesson.position)
    ).all())


def update_progress(db: Session, enrollment_id: UUID, lesson: Lesson, *, status: ProgressStatus, seconds: int) -> LessonProgress:
    progress = db.scalar(select(LessonProgress).where(LessonProgress.enrollment_id == enrollment_id, LessonProgress.lesson_id == lesson.id))
    now = datetime.now(timezone.utc)
    if progress is None:
        progress = LessonProgress(enrollment_id=enrollment_id, lesson_id=lesson.id, status=status, started_at=now)
        db.add(progress)
    else:
        progress.status = status
        if progress.started_at is None:
            progress.started_at = now
    progress.time_spent_seconds = min(86400, (progress.time_spent_seconds or 0) + seconds)
    progress.completed_at = now if status == ProgressStatus.COMPLETED else None
    progress.updated_at = now
    db.commit()
    db.refresh(progress)
    return progress


def find_final_quiz(db: Session, course_id: UUID) -> Quiz | None:
    return db.scalar(select(Quiz).where(Quiz.course_id == course_id, Quiz.is_final.is_(True), Quiz.is_published.is_(True)))


def list_published_quizzes(db: Session, course_id: UUID) -> list[Quiz]:
    return list(db.scalars(select(Quiz).where(Quiz.course_id == course_id, Quiz.is_published.is_(True)).order_by(Quiz.created_at)))


def list_quiz_attempts(db: Session, course_id: UUID, user_id: UUID) -> list[QuizAttempt]:
    return list(db.scalars(
        select(QuizAttempt)
        .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
        .where(Quiz.course_id == course_id, Quiz.is_published.is_(True), QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.submitted_at.desc(), QuizAttempt.started_at.desc())
    ))


def quiz_questions(db: Session, quiz_id: UUID) -> list[tuple[Question, list[AnswerOption]]]:
    questions = list(db.scalars(select(Question).where(Question.quiz_id == quiz_id).order_by(Question.position)))
    return [(question, list(db.scalars(select(AnswerOption).where(AnswerOption.question_id == question.id).order_by(AnswerOption.position)))) for question in questions]


def count_attempts(db: Session, quiz_id: UUID, user_id: UUID) -> int:
    return int(db.scalar(select(func.count(QuizAttempt.id)).where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user_id)) or 0)


def submit_quiz(db: Session, quiz: Quiz, user_id: UUID, answers: dict[UUID, UUID], feedback: list[dict[str, object]], correct_count: int, total: int, score: float, passed: bool) -> QuizAttempt:
    attempt = QuizAttempt(
        quiz_id=quiz.id, user_id=user_id, attempt_number=count_attempts(db, quiz.id, user_id) + 1,
        correct_count=correct_count, total_questions=total, score_percent=score, passed=passed,
        started_at=datetime.now(timezone.utc), submitted_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.flush()
    for result in feedback:
        db.add(AttemptAnswer(
            attempt_id=attempt.id, question_id=result["question_id"],
            selected_option_id=result["selected_option_id"], is_correct=bool(result["is_correct"]),
        ))
    db.commit()
    db.refresh(attempt)
    return attempt


def list_channels(db: Session, course_id: UUID) -> list[DiscussionChannel]:
    return list(db.scalars(select(DiscussionChannel).where(DiscussionChannel.course_id == course_id).order_by(DiscussionChannel.position)))


def get_channel(db: Session, course_id: UUID, slug: str) -> DiscussionChannel | None:
    return db.scalar(select(DiscussionChannel).where(DiscussionChannel.course_id == course_id, DiscussionChannel.slug == slug))


def list_channel_posts(db: Session, channel: DiscussionChannel) -> list[tuple[DiscussionPost, User]]:
    query = (
        select(DiscussionPost, User)
        .join(User, User.id == DiscussionPost.author_id)
        .join(DiscussionThread, DiscussionThread.id == DiscussionPost.thread_id)
        .where(DiscussionThread.channel_id == channel.id, DiscussionPost.is_hidden.is_(False), DiscussionThread.is_hidden.is_(False))
        .order_by(DiscussionPost.created_at)
        .limit(100)
    )
    return list(db.execute(query).all())


def create_channel_post(db: Session, channel: DiscussionChannel, user: User, body: str) -> DiscussionPost:
    thread = db.scalar(select(DiscussionThread).where(DiscussionThread.channel_id == channel.id).order_by(DiscussionThread.created_at).limit(1))
    if thread is None:
        thread = DiscussionThread(course_id=channel.course_id, module_id=channel.module_id, channel_id=channel.id, author_id=user.id, title=channel.title, body=channel.description)
        db.add(thread)
        db.flush()
    post = DiscussionPost(thread_id=thread.id, author_id=user.id, body=body)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def get_group_task(db: Session) -> GroupTask | None:
    return db.scalar(select(GroupTask).order_by(GroupTask.created_at).limit(1))


def get_user_submission(db: Session, task_id: UUID, user_id: UUID) -> tuple[TaskGroup, TaskSubmission] | None:
    row = db.execute(
        select(TaskGroup, TaskSubmission)
        .join(GroupMember, GroupMember.group_id == TaskGroup.id)
        .join(TaskSubmission, TaskSubmission.group_id == TaskGroup.id)
        .where(TaskGroup.task_id == task_id, GroupMember.user_id == user_id)
        .order_by(TaskSubmission.submitted_at.desc()).limit(1)
    ).first()
    return row


def save_user_submission(db: Session, task: GroupTask, user_id: UUID, content: dict[str, object]) -> TaskSubmission:
    group = db.scalar(select(TaskGroup).where(TaskGroup.task_id == task.id).order_by(TaskGroup.created_at).limit(1))
    if group is None:
        group = TaskGroup(task_id=task.id, name="Course cohort")
        db.add(group)
        db.flush()
    membership = db.get(GroupMember, (group.id, user_id))
    if membership is None:
        db.add(GroupMember(group_id=group.id, user_id=user_id))
    submission = TaskSubmission(group_id=group.id, submitted_by=user_id, content=content)
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

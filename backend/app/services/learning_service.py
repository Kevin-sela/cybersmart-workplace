from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.entities import Lesson, ProgressStatus, User
from app.repositories import learning as repository
from app.schemas.learning import (
    CourseRead, LessonRead, ModuleRead, ProgressItem, ProgressRead,
    ProgressUpdate, QuizAttemptSummary, QuizFeedback, QuizQuestionRead, QuizOptionRead, QuizRead,
    QuizResult, QuizSubmit,
)


def list_courses(db: Session) -> list[CourseRead]:
    return [get_course(db, course.slug) for course in repository.list_courses(db)]


def get_course(db: Session, slug: str) -> CourseRead:
    course = repository.get_course(db, slug)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
    modules = []
    for module in repository.list_modules(db, course.id):
        lessons = [LessonRead(
            id=lesson.id, slug=lesson.slug, title=lesson.title,
            content_type=lesson.content_type.value, body=lesson.body,
            transcript=lesson.transcript, estimated_minutes=lesson.estimated_minutes,
            position=lesson.position,
        ) for lesson in repository.list_lessons(db, module.id)]
        modules.append(ModuleRead(
            id=module.id, week_number=module.week_number, title=module.title,
            summary=module.summary, position=module.position, lessons=lessons,
        ))
    return CourseRead(
        id=course.id, slug=course.slug, title=course.title,
        description=course.description, duration_weeks=course.duration_weeks,
        modules=modules,
    )


def get_lesson(db: Session, slug: str) -> LessonRead:
    lesson = repository.get_lesson(db, slug)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found.")
    return LessonRead(
        id=lesson.id, slug=lesson.slug, title=lesson.title,
        content_type=lesson.content_type.value, body=lesson.body,
        transcript=lesson.transcript, estimated_minutes=lesson.estimated_minutes,
        position=lesson.position,
    )


def get_progress(db: Session, user: User) -> ProgressRead:
    course = repository.get_course(db, "cybersmart-workplace")
    if course is None:
        raise HTTPException(status_code=503, detail="Course content is not available yet.")
    enrollment = repository.get_enrollment(db, user.id, course.id)
    if enrollment is None:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course.")
    rows = repository.get_progress(db, enrollment.id)
    items = [ProgressItem(
        lesson_id=lesson.id,
        lesson_slug=lesson.slug,
        lesson_title=lesson.title,
        estimated_minutes=lesson.estimated_minutes,
        module_week=module.week_number,
        status=progress.status.value if progress else ProgressStatus.NOT_STARTED.value,
        completed_at=progress.completed_at if progress else None,
    ) for lesson, progress, module in rows]
    completed = sum(item.status == ProgressStatus.COMPLETED.value for item in items)
    total = len(items)
    module_rows: dict[UUID, list[ProgressStatus]] = {}
    for lesson, progress, module in rows:
        module_rows.setdefault(module.id, []).append(progress.status if progress else ProgressStatus.NOT_STARTED)
    completed_modules = sum(all(status == ProgressStatus.COMPLETED for status in statuses) for statuses in module_rows.values())
    quizzes = repository.list_published_quizzes(db, course.id)
    attempts = repository.list_quiz_attempts(db, course.id, user.id)
    passed_quizzes = {attempt.quiz_id for attempt in attempts if attempt.passed}
    total_activities = total + len(quizzes)
    completed_activities = completed + len(passed_quizzes)
    latest_attempt = attempts[0] if attempts else None
    return ProgressRead(
        completed_lessons=completed, total_lessons=total,
        completed_modules=completed_modules, total_modules=len(module_rows),
        quiz_attempts_count=len(attempts), passed_quizzes_count=len(passed_quizzes),
        latest_quiz=QuizAttemptSummary(
            score_percent=float(latest_attempt.score_percent),
            passed=latest_attempt.passed,
            submitted_at=latest_attempt.submitted_at,
        ) if latest_attempt else None,
        completed_activities=completed_activities, total_activities=total_activities,
        percent_complete=round((completed_activities / total_activities) * 100) if total_activities else 0,
        items=items,
    )


def update_progress(db: Session, user: User, lesson_id: UUID, payload: ProgressUpdate) -> ProgressRead:
    course = repository.get_course(db, "cybersmart-workplace")
    if course is None:
        raise HTTPException(status_code=503, detail="Course content is not available yet.")
    enrollment = repository.get_enrollment(db, user.id, course.id)
    lesson = db.get(Lesson, lesson_id)
    if enrollment is None or lesson is None:
        raise HTTPException(status_code=404, detail="Course lesson was not found.")
    if lesson.module_id not in {module.id for module in repository.list_modules(db, course.id)}:
        raise HTTPException(status_code=404, detail="Course lesson was not found.")
    status_value = ProgressStatus(payload.status)
    repository.update_progress(db, enrollment.id, lesson, status=status_value, seconds=payload.time_spent_seconds)
    return get_progress(db, user)


def get_final_quiz(db: Session) -> QuizRead:
    course = repository.get_course(db, "cybersmart-workplace")
    quiz = repository.find_final_quiz(db, course.id) if course else None
    if quiz is None:
        raise HTTPException(status_code=404, detail="The knowledge check is not available yet.")
    questions = []
    for question, options in repository.quiz_questions(db, quiz.id):
        questions.append(QuizQuestionRead(
            id=question.id, prompt=question.prompt, position=question.position,
            options=[QuizOptionRead(id=option.id, text=option.text, position=option.position) for option in options],
        ))
    return QuizRead(id=quiz.id, title=quiz.title, instructions=quiz.instructions, pass_mark_percent=quiz.pass_mark_percent, questions=questions)


def submit_final_quiz(db: Session, user: User, payload: QuizSubmit) -> QuizResult:
    course = repository.get_course(db, "cybersmart-workplace")
    quiz = repository.find_final_quiz(db, course.id) if course else None
    if quiz is None:
        raise HTTPException(status_code=404, detail="The knowledge check is not available yet.")
    questions = repository.quiz_questions(db, quiz.id)
    question_by_id = {question.id: (question, options) for question, options in questions}
    submitted = {answer.question_id: answer.selected_option_id for answer in payload.answers}
    if set(submitted) != set(question_by_id):
        raise HTTPException(status_code=422, detail="Answer every question exactly once.")
    results: list[QuizFeedback] = []
    correct = 0
    stored_answers: list[dict[str, object]] = []
    for question, options in questions:
        selected_id = submitted[question.id]
        selected = next((option for option in options if option.id == selected_id), None)
        if selected is None:
            raise HTTPException(status_code=422, detail="An answer does not belong to its question.")
        right = next(option for option in options if option.is_correct)
        is_correct = selected.id == right.id
        correct += int(is_correct)
        results.append(QuizFeedback(
            question_id=question.id, selected_option_id=selected.id,
            correct_option_id=right.id, correct_answer=right.text,
            is_correct=is_correct, explanation=question.explanation,
            answer_feedback=selected.feedback,
        ))
        stored_answers.append({"question_id": question.id, "selected_option_id": selected.id, "is_correct": is_correct})
    total = len(questions)
    score = round((correct / total) * 100, 2) if total else 0
    passed = score >= quiz.pass_mark_percent
    attempt = repository.submit_quiz(db, quiz, user.id, submitted, stored_answers, correct, total, score, passed)
    return QuizResult(
        attempt_id=attempt.id, correct_count=correct, total_questions=total,
        score_percent=score, passed=passed, pass_mark_percent=quiz.pass_mark_percent,
        feedback=results,
    )

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.seed_data import seed_demo_content
from app.models.entities import Course, Lesson, OAuthIdentity, ProgressStatus, Question, Quiz
from app.repositories.users import get_or_link_google_user
from app.repositories import learning as learning_repository
from app.services.learning_service import get_progress
from app.schemas.auth import RegisterRequest
from app.schemas.collaboration import ForumPostInput
from app.schemas.profile import ProfileUpdate


def test_course_seed_is_repeatable_and_populates_assessments() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        seed_demo_content(db)
        seed_demo_content(db)
        assert len(list(db.scalars(select(Course)))) == 1
        assert len(list(db.scalars(select(Question)))) == 10
    engine.dispose()


def test_registration_rejects_unmatched_passwords_and_role_injection() -> None:
    try:
        RegisterRequest(email="learner@example.com", full_name="A Learner", password="long-password-one", confirm_password="long-password-two")
    except ValueError:
        pass
    else:
        raise AssertionError("mismatched passwords must fail validation")
    try:
        RegisterRequest(email="learner@example.com", full_name="A Learner", password="long-password-one", confirm_password="long-password-one", role="admin")
    except ValueError:
        pass
    else:
        raise AssertionError("registration must reject fields outside the allowlist")


def test_free_text_is_normalized_and_control_characters_are_rejected() -> None:
    assert ForumPostInput(body="  Cafe\u0301  ").body == "Café"
    try:
        ForumPostInput(body="hello\u0000world")
    except ValueError:
        pass
    else:
        raise AssertionError("control characters must fail validation")
    assert ProfileUpdate(full_name="  Kevin O'Neil ", bio="  Learner  ", locale="en_US").locale == "en-us"


def test_google_identity_is_linked_to_one_local_learner() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        seed_demo_content(db)
        first = get_or_link_google_user(db, subject="google-subject-1", email="learner@example.com", full_name="A Learner", password_hash="unusable-random-password-hash")
        second = get_or_link_google_user(db, subject="google-subject-1", email="learner@example.com", full_name="A Learner", password_hash="unused")
        assert first.id == second.id
        assert db.query(OAuthIdentity).count() == 1
    engine.dispose()


def test_progress_counts_saved_lessons_and_passed_quiz_attempts() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        seed_demo_content(db)
        user = get_or_link_google_user(
            db, subject="progress-user", email="progress@example.com",
            full_name="Progress Learner", password_hash="unused",
        )
        course = db.scalar(select(Course).where(Course.slug == "cybersmart-workplace"))
        lesson = db.scalar(select(Lesson).where(Lesson.slug == "first-steps"))
        quiz = db.scalar(select(Quiz).where(Quiz.course_id == course.id, Quiz.is_final.is_(True)))
        assert course is not None and lesson is not None and quiz is not None
        enrollment = learning_repository.get_enrollment(db, user.id, course.id)
        assert enrollment is not None

        before = get_progress(db, user)
        assert before.percent_complete == 0
        assert before.total_activities == 5
        assert before.quiz_attempts_count == 0

        learning_repository.submit_quiz(db, quiz, user.id, {}, [], 4, 10, 40, False)
        failed_attempt = get_progress(db, user)
        assert failed_attempt.quiz_attempts_count == 1
        assert failed_attempt.passed_quizzes_count == 0
        assert failed_attempt.latest_quiz is not None and failed_attempt.latest_quiz.score_percent == 40
        assert failed_attempt.percent_complete == 0

        lesson_progress = learning_repository.update_progress(db, enrollment.id, lesson, status=ProgressStatus.COMPLETED, seconds=42)
        learning_repository.submit_quiz(db, quiz, user.id, {}, [], 8, 10, 80, True)

        after = get_progress(db, user)
        assert after.completed_lessons == 1
        assert lesson_progress.time_spent_seconds == 42
        assert after.completed_modules == 1
        assert after.quiz_attempts_count == 2
        assert after.passed_quizzes_count == 1
        assert after.latest_quiz is not None and after.latest_quiz.score_percent == 80
        assert after.completed_activities == 2
        assert after.percent_complete == 40
    engine.dispose()

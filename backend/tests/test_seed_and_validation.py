from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.seed_data import seed_demo_content
from app.models.entities import Course, OAuthIdentity, Question
from app.repositories.users import get_or_link_google_user
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

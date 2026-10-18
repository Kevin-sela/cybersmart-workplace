from app.db.seed_data import seed_demo_content
from app.db.session import SessionLocal


def main() -> None:
    with SessionLocal() as db:
        seed_demo_content(db)
    print("CyberSmart demo course seed is up to date.")


if __name__ == "__main__":
    main()

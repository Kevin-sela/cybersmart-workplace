"""Small, repeatable course seed used for the local SQLite demo."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import (
    AnswerOption, BloomLevel, ContentType, Course, DiscussionChannel, GroupTask,
    LearningObjective, Lesson, Module, Question, Quiz, Survey, SurveyQuestion,
    SurveyQuestionType,
)

COURSE_SLUG = "cybersmart-workplace"
MODULES = [
    (1, "Recognise threats", "Spot suspicious messages, links, and requests."),
    (2, "Choose safe actions", "Protect accounts and workplace information."),
    (3, "Respond and collaborate", "Practise a calm, useful incident response."),
    (4, "Review and demonstrate", "Bring your skills together in realistic scenarios."),
]
LESSONS = [
    ("first-steps", "First steps: spot a suspicious message", "Pause before acting on unexpected requests. Check the complete sender address, inspect where a link actually leads, notice urgency or secrecy, and verify unusual requests through a separate trusted channel. HTTPS alone does not prove a site is legitimate. Report suspicious messages through your organisation’s approved route.", 8, True),
    ("safe-actions", "Choose a safe action", "Pause and check the context. Use known bookmarks or contact details, never share a one-time code, and ask your IT team when the request cannot be verified.", 8, True),
    ("respond-together", "Respond and collaborate", "If you interact with a suspicious message, stop, record what happened, and contact your IT or security team promptly. Follow local incident response instructions.", 8, True),
    ("final-review", "Review and demonstrate", "Review sender, link, urgency, and attachment clues, then select a safe response. Explain how to report the event through a trusted workplace channel.", 10, True),
]
OBJECTIVES = [
    ("O1", "Identify common phishing indicators in sample messages.", BloomLevel.ANALYSE, 1),
    ("O2", "Distinguish suspicious links from safer destinations.", BloomLevel.ANALYSE, 1),
    ("O3", "Select a safe next step for an unusual workplace request.", BloomLevel.APPLY, 2),
    ("O4", "Describe safe account protection practices, including MFA.", BloomLevel.UNDERSTAND, 2),
    ("O5", "Contribute an evidence-based point to a moderated discussion.", BloomLevel.EVALUATE, 3),
    ("O6", "Submit an accurate group response checklist.", BloomLevel.CREATE, 3),
    ("O7", "Score at least 80% on the course knowledge check.", BloomLevel.APPLY, 4),
]
QUIZ = [
    ("A link displays `https://accounts.example@verify-login.example/sign-in`. What should you do?", "The host is after the @ sign. Avoid the ambiguous link and use a known route.", "O1", [("Open it because the visible text looks familiar.", False), ("Avoid it and visit from a known bookmark.", True), ("Reply to the sender to ask if it is safe.", False)]),
    ("A shortened link says your mailbox closes in ten minutes. What is safest?", "Urgency and an obscured destination are warning signs.", "O2", [("Use the short link before the deadline.", False), ("Open the service from a bookmark and report the message.", True), ("Forward the link to a colleague to test it.", False)]),
    ("A website shows HTTPS. Does that prove it belongs to the organisation it names?", "HTTPS encrypts the connection but does not prove the site is genuine.", "O2", [("Yes, HTTPS verifies the organisation.", False), ("No, check the domain and use a known route.", True), ("Only if the page has a logo.", False)]),
    ("A familiar display name has a sender address that differs by one character. What should you do?", "Display names can be copied; verify using a known contact method.", "O1", [("Trust the display name.", False), ("Check the address and confirm through a known contact.", True), ("Open the attachment to check it.", False)]),
    ("You receive a sign-in code you did not request. What should you do?", "Do not share the code; secure the account using the official service and report it.", "O4", [("Share the code to stop the prompts.", False), ("Do not approve it; change your password through the official service and report it.", True), ("Reuse the password on another site.", False)]),
    ("A caller claiming to be your manager urgently asks for gift cards and secrecy. What is safest?", "Urgency and secrecy are pressure tactics. Verify independently.", "O3", [("Buy them because the caller knows your manager’s name.", False), ("End the call and verify through a trusted contact.", True), ("Ask for payment details by email.", False)]),
    ("An unexpected document asks you to enable macros. What should you do?", "Do not enable macros in unexpected files; verify and report them.", "O1", [("Enable macros to view the invoice.", False), ("Do not enable them; verify and report the message.", True), ("Upload the file to a public site.", False)]),
    ("A colleague sends a chat link that asks you to sign in. How should you check it?", "A colleague’s account may be compromised. Verify separately and use a known route.", "O3", [("Sign in because it came from a colleague.", False), ("Verify separately and use a bookmark.", True), ("Post the link in a forum for votes.", False)]),
    ("You entered your password on a page that now seems suspicious. What should you do first?", "Promptly notify IT and secure the account using the official service.", "O6", [("Close the page and wait.", False), ("Contact IT and change the password through the official service.", True), ("Send the password to a colleague to check it.", False)]),
    ("You suspect a message is phishing. What belongs in a report?", "Use the approved reporting route and include original message details.", "O5", [("Forward the link to the whole team.", False), ("Use the approved channel and include message details.", True), ("Delete it without telling anyone.", False)]),
]


def seed_demo_content(db: Session) -> None:
    course = db.scalar(select(Course).where(Course.slug == COURSE_SLUG))
    if course is None:
        course = Course(slug=COURSE_SLUG, title="CyberSmart Workplace: Practical Cybersecurity Awareness", description="A four-week, practice-based course on recognising and responding to common workplace cyber threats.", audience="Working professionals with mixed cybersecurity knowledge", duration_weeks=4, is_published=True)
        db.add(course)
        db.flush()
    else:
        course.is_published = True

    modules = {}
    for week, title, summary in MODULES:
        module = db.scalar(select(Module).where(Module.course_id == course.id, Module.position == week))
        if module is None:
            module = Module(course_id=course.id, week_number=week, title=title, summary=summary, position=week)
            db.add(module)
            db.flush()
        modules[week] = module
        slug, lesson_title, body, minutes, published = LESSONS[week - 1]
        lesson = db.scalar(select(Lesson).where(Lesson.module_id == module.id, Lesson.slug == slug))
        if lesson is None:
            db.add(Lesson(module_id=module.id, slug=slug, title=lesson_title, content_type=ContentType.TEXT, body=body, estimated_minutes=minutes, position=1, is_published=published))
        else:
            lesson.is_published = published

    for code, description, level, due_week in OBJECTIVES:
        if db.scalar(select(LearningObjective.id).where(LearningObjective.course_id == course.id, LearningObjective.code == code)) is None:
            db.add(LearningObjective(course_id=course.id, code=code, description=description, level=level, due_week=due_week))
    db.flush()

    quiz = db.scalar(select(Quiz).where(Quiz.course_id == course.id, Quiz.title == "CyberSmart knowledge check"))
    if quiz is None:
        quiz = Quiz(course_id=course.id, module_id=modules[4].id, title="CyberSmart knowledge check", instructions="Choose the safest response. Review the explanation after submitting.", pass_mark_percent=80, is_final=True, is_published=True)
        db.add(quiz)
        db.flush()
    for position, (prompt, explanation, objective_code, options) in enumerate(QUIZ, start=1):
        question = db.scalar(select(Question).where(Question.quiz_id == quiz.id, Question.position == position))
        if question is None:
            objective = db.scalar(select(LearningObjective).where(LearningObjective.course_id == course.id, LearningObjective.code == objective_code))
            question = Question(quiz_id=quiz.id, objective_id=objective.id if objective else None, prompt=prompt, explanation=explanation, position=position)
            db.add(question)
            db.flush()
        for option_position, (answer, is_correct) in enumerate(options, start=1):
            if db.scalar(select(AnswerOption.id).where(AnswerOption.question_id == question.id, AnswerOption.position == option_position)) is None:
                db.add(AnswerOption(question_id=question.id, text=answer, is_correct=is_correct, feedback="Review the explanation and use a trusted verification route.", position=option_position))

    channels = [("welcome", "Welcome", "Introductions and course notes"), ("spot-the-phish", "Spot the phish", "Compare suspicious message clues"), ("account-safety", "Account safety", "Passwords and multi-factor sign-in"), ("team-response", "Team response", "What to do when something happens")]
    for position, (slug, title, description) in enumerate(channels, start=1):
        if db.scalar(select(DiscussionChannel.id).where(DiscussionChannel.course_id == course.id, DiscussionChannel.slug == slug)) is None:
            db.add(DiscussionChannel(course_id=course.id, module_id=modules[min(position, 4)].id, slug=slug, title=title, description=description, position=position))
    task = db.scalar(select(GroupTask).where(GroupTask.module_id == modules[3].id, GroupTask.title == "Build a phishing response checklist"))
    if task is None:
        db.add(GroupTask(module_id=modules[3].id, title="Build a phishing response checklist", brief="Agree on clear steps a colleague can follow after noticing or interacting with a suspicious message.", rubric=[{"criterion": item, "max_points": 1} for item in ["Pause before opening an unexpected link", "Check the sender and destination", "Verify unusual requests through a trusted channel", "Report through the approved process", "Contact IT if information was shared"]]))
    survey = db.scalar(select(Survey).where(Survey.course_id == course.id, Survey.title == "CyberSmart course feedback"))
    if survey is None:
        survey = Survey(course_id=course.id, title="CyberSmart course feedback", is_open=True)
        db.add(survey)
        db.flush()
    questions = [("The lessons were easy to follow.", SurveyQuestionType.LIKERT), ("I can recognise more suspicious messages now.", SurveyQuestionType.LIKERT), ("The practice examples felt relevant.", SurveyQuestionType.LIKERT), ("What was most useful?", SurveyQuestionType.OPEN_TEXT)]
    for position, (prompt, question_type) in enumerate(questions, start=1):
        if db.scalar(select(SurveyQuestion.id).where(SurveyQuestion.survey_id == survey.id, SurveyQuestion.position == position)) is None:
            db.add(SurveyQuestion(survey_id=survey.id, prompt=prompt, question_type=question_type, position=position))
    db.commit()

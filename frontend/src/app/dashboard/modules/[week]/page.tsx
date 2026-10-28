import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { COURSE_MODULES, COURSE_VIDEOS } from "@/lib/course";
import { CourseVideo } from "@/components/course/course-video";

const moduleDetails: Record<number, { overview: string; outcome: string; points: string[]; lesson: { title: string; body: string }[]; scenario: string; response: string; actionLabel: string; actionHref: string; video?: "mfa" | "secureHabits" }> = {
  2: {
    overview: "Everyday security comes down to a few repeatable habits: verify the person asking, protect your sign-in, and use trusted routes to reach workplace services.",
    outcome: "Protect your accounts and verify unusual requests.",
    points: ["Verify unexpected requests", "Use strong passwords and turn on MFA"],
    lesson: [
      { title: "Verify before you respond", body: "If someone asks for a payment, password reset, or sensitive file, pause. Contact them through a number or address you already trust instead of replying to the message." },
      { title: "Protect your sign-in", body: "Use a unique password stored in an approved password manager. Multi-factor authentication adds another check; never share its code or approve a prompt you did not start." },
      { title: "Use a known route", body: "Open work tools from a saved bookmark or your organisation’s normal portal. Avoid unexpected links, even when a message looks familiar." },
    ],
    scenario: "A colleague messages from a new number asking you to send a one-time sign-in code so they can finish a task.",
    response: "Do not share the code. Contact your colleague using their saved work details and report the unexpected request if it cannot be verified.",
    actionLabel: "Try a sample knowledge check", actionHref: "/dashboard/quiz", video: "mfa",
  },
  3: {
    overview: "A quick, clear report helps your support team limit harm. You do not need to investigate or prove that an incident happened before reporting it.",
    outcome: "Respond quickly and let the right people know.",
    points: ["Stop interacting with the message", "Note what happened", "Tell your support team"],
    lesson: [
      { title: "Stop and contain", body: "Do not click again, reply, forward the message to colleagues, or try to fix the device yourself. If you entered a password, say so immediately." },
      { title: "Record the useful details", body: "Keep the message if it is safe to do so. Note what you clicked, when it happened, and any information you entered. Avoid taking actions that could destroy evidence." },
      { title: "Report through the right channel", body: "Use your organisation’s security reporting tool or contact IT directly. Share the facts you know and follow the response instructions you receive." },
    ],
    scenario: "You opened an attachment that now seems suspicious. Nothing unusual has happened on screen.",
    response: "Stop using the attachment, report it to IT now, and explain what you opened and when. Don’t assume that no visible change means everything is safe.",
    actionLabel: "Build a response checklist", actionHref: "/dashboard/group-task", video: "secureHabits",
  },
  4: {
    overview: "This review brings the course habits together. Read the whole situation, identify what needs protecting, then choose a safe next step and report when needed.",
    outcome: "Put the key safety steps into practice.",
    points: ["Spot the warning sign", "Choose a safe next step"],
    lesson: [
      { title: "Read the whole situation", body: "Look at the sender, request, link or attachment, and any pressure to act quickly. One clue alone may not tell the whole story." },
      { title: "Choose the safest next step", body: "Pause, avoid sharing credentials or codes, and verify through a separate trusted channel. If you already interacted, report promptly and describe what happened." },
    ],
    scenario: "An urgent email from a familiar display name asks you to open a document and sign in to keep access to a shared file.",
    response: "Do not use the email link. Check the sender and destination, open the file service from a trusted bookmark, and report the message if the request is unexpected.",
    actionLabel: "Try the sample final check", actionHref: "/dashboard/quiz",
  },
};

export function generateStaticParams() {
  return COURSE_MODULES.filter(module => module.week > 1).map(module => ({ week: String(module.week) }));
}

export default async function CourseModuleDetailPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const number = Number(week);
  const courseModule = COURSE_MODULES.find(item => item.week === number);
  const details = moduleDetails[number];
  if (!courseModule || !details) notFound();

  return <div className="dashboard-page detail-page"><DashboardHeader active="modules"/><main className="dashboard-main">
    <div className="dashboard-breadcrumb"><Link href="/dashboard">Overview</Link><span aria-hidden="true">/</span><Link href="/dashboard/modules">Modules</Link><span aria-hidden="true">/</span><strong>Module {number}</strong></div>
    <section className="dashboard-welcome detail-welcome"><div><p className="dashboard-eyebrow">MODULE {String(number).padStart(2,"0")}</p><h1>{courseModule.title}</h1><p>{courseModule.detail}</p></div></section>
    <div className="module-detail-layout"><Card className="overview-panel module-detail-card">
      <section className="module-overview-copy" aria-labelledby="module-overview-title"><p className="dashboard-eyebrow">OVERVIEW</p><h2 id="module-overview-title">Overview</h2><p>{details.overview}</p></section>
      <section className="module-learning-goals" aria-labelledby="module-learning-title"><div className="module-detail-heading"><div><span className="module-detail-icon" aria-hidden="true">{String(number).padStart(2,"0")}</span><div><p className="dashboard-eyebrow">LEARNING GOALS</p><h2 id="module-learning-title">What you’ll learn</h2></div></div></div><p className="module-detail-outcome">{details.outcome}</p>
      <ul className="module-detail-points">{details.points.map(point=><li key={point}><span aria-hidden="true">✓</span>{point}</li>)}</ul></section>
      <section className="module-lesson-content" aria-labelledby="module-lesson-title"><p className="dashboard-eyebrow">LESSON</p><h2 id="module-lesson-title">Put it into practice</h2>{details.lesson.map(item=><div className="module-lesson-section" key={item.title}><h3>{item.title}</h3><p>{item.body}</p></div>)}</section>
      {details.video && <CourseVideo video={COURSE_VIDEOS[details.video]} />}
      <section className="quick-check module-quick-check"><p className="eyebrow">QUICK CHECK</p><h2>What would you do?</h2><p>{details.scenario}</p><details><summary>Show a safe response</summary><p>{details.response}</p></details></section>
      <Link className="next-lesson-button module-detail-action" href={details.actionHref}>{details.actionLabel}<span aria-hidden="true">→</span></Link>
    </Card></div>
  </main></div>;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { COURSE_MODULES } from "@/lib/course";

const moduleDetails: Record<number, { outcome: string; points: string[]; actionLabel: string; actionHref: string }> = {
  2: {
    outcome: "Learn to pause, check the context, and choose a safe response when a request feels unusual.",
    points: ["Verify unexpected requests using a trusted contact method", "Protect accounts with strong, unique passwords and multi-factor authentication", "Report suspicious messages through your organisation’s approved channel"],
    actionLabel: "Try a sample knowledge check", actionHref: "/dashboard/quiz",
  },
  3: {
    outcome: "Practise a calm response and work with your team when something may have gone wrong.",
    points: ["Stop interacting with a suspicious message or site", "Record what happened and when", "Share the details with the right support team"],
    actionLabel: "Build a response checklist", actionHref: "/dashboard/group-task",
  },
  4: {
    outcome: "Bring the course skills together and decide what to do in realistic workplace situations.",
    points: ["Review the clues in a suspicious message", "Choose a safe next step", "Explain how you would report and follow up"],
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
    <div className="module-detail-layout"><Card className="overview-panel module-detail-card"><div className="module-detail-heading"><div><span className="module-detail-icon" aria-hidden="true">{String(number).padStart(2,"0")}</span><div><p className="dashboard-eyebrow">LEARNING OUTCOME</p><h2>What you’ll learn</h2></div></div></div><p className="module-detail-outcome">{details.outcome}</p>
      <ul className="module-detail-points">{details.points.map(point=><li key={point}><span aria-hidden="true">✓</span>{point}</li>)}</ul>
      <div className="module-detail-status"><strong>Practice activity</strong><span>Apply these steps to a realistic workplace scenario.</span></div>
      <Link className="next-lesson-button module-detail-action" href={details.actionHref}>{details.actionLabel}<span aria-hidden="true">→</span></Link>
    </Card><aside className="module-detail-aside"><Card className="overview-panel module-detail-meta"><p className="dashboard-eyebrow">COURSE</p><h2>Practical cybersecurity awareness</h2><p>Four short modules for safer work.</p><Link className="overview-text-link" href="/dashboard/modules">See all modules <span aria-hidden="true">→</span></Link></Card><Link className="module-detail-back" href="/dashboard">← Back to overview</Link></aside></div>
  </main></div>;
}

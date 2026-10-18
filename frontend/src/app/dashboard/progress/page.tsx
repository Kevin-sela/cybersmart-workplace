"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProgressDonut } from "@/components/dashboard/progress-donut";
import { COURSE_MODULES, COURSE_PROGRESS, LESSON_PROGRESS_KEY } from "@/lib/course";
import { api, ProgressSummary } from "@/services/api";

export default function ProgressPage() {
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [apiProgress, setApiProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    setCompleted(window.localStorage.getItem(LESSON_PROGRESS_KEY) === "complete");
    setLoaded(true);
    api.progress().then(value => { setApiProgress(value); setCompleted(value.completed_lessons > 0); }).catch(() => setApiProgress(null));
  }, []);

  const completedModules = apiProgress ? new Set(apiProgress.items.filter(item => item.status === "completed").map(item => item.module_week)).size : completed ? 1 : 0;
  const progress = apiProgress?.percent_complete ?? (loaded && completed ? COURSE_PROGRESS : 0);

  return (
    <div className="dashboard-page detail-page">
      <DashboardHeader active="progress" />
      <main className="dashboard-main">
        <div className="dashboard-breadcrumb"><Link href="/dashboard">My learning</Link><span aria-hidden="true">/</span><strong>Progress</strong><Badge variant="muted">Course preview</Badge></div>
        <section className="dashboard-welcome detail-welcome">
          <div><p className="dashboard-eyebrow">YOUR COURSE</p><h1>Progress and achievements</h1><p>Review your completed modules and pick up where you left off.</p></div>
          <Link className="dashboard-cta" href={completed ? "/dashboard/modules" : "/learn/first-steps"}>{completed ? "Browse modules" : "Start first lesson"}<span aria-hidden="true">→</span></Link>
        </section>
        <div className="detail-stat-row">
          <Card className="detail-stat-card"><CardHeader><CardDescription>OVERALL PROGRESS</CardDescription><CardTitle>{progress}%</CardTitle></CardHeader><CardContent><p>Course completion</p></CardContent></Card>
          <Card className="detail-stat-card"><CardHeader><CardDescription>MODULES COMPLETED</CardDescription><CardTitle>{completedModules} <span>of {COURSE_MODULES.length}</span></CardTitle></CardHeader><CardContent><p>{completedModules ? "Your course progress is saved." : "Complete a lesson to get started."}</p></CardContent></Card>
          <Card className="detail-stat-card"><CardHeader><CardDescription>NEXT MILESTONE</CardDescription><CardTitle>{completedModules ? `Module ${Math.min(completedModules + 1, COURSE_MODULES.length)}` : "Module 1"}</CardTitle></CardHeader><CardContent><p>{completedModules ? "Continue with the next course lesson." : "Recognise common cyber threats."}</p></CardContent></Card>
        </div>
        <Card className="detail-chart-card">
          <CardHeader className="progress-detail-header"><div><p className="dashboard-eyebrow">COURSE BREAKDOWN</p><CardTitle>Overall completion</CardTitle><CardDescription>Progress is saved to your learner account when you sign in.</CardDescription></div><Badge variant={completedModules ? "success" : "default"}>{completedModules} complete</Badge></CardHeader>
          <CardContent className="detail-donut-content"><ProgressDonut value={progress} completedModules={completedModules} totalModules={COURSE_MODULES.length} /></CardContent>
        </Card>
      </main>
    </div>
  );
}

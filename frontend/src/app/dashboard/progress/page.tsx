"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProgressDonut } from "@/components/dashboard/progress-donut";
import { COURSE_MODULES, LESSON_PROGRESS_KEY } from "@/lib/course";
import { api, ProgressSummary } from "@/services/api";

export default function ProgressPage() {
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const [apiProgress, setApiProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    setCompleted(window.localStorage.getItem(LESSON_PROGRESS_KEY) === "complete");
    setLoaded(true);
    const loadProgress = () => api.progress().then(value => { setApiProgress(value); setCompleted(value.completed_lessons > 0); }).catch(() => setApiProgress(null)).finally(() => setProgressLoading(false));
    loadProgress();
    window.addEventListener("focus", loadProgress);
    window.addEventListener("pageshow", loadProgress);
    window.addEventListener("cybersmart:learning-updated", loadProgress);
    return () => {
      window.removeEventListener("focus", loadProgress);
      window.removeEventListener("pageshow", loadProgress);
      window.removeEventListener("cybersmart:learning-updated", loadProgress);
    };
  }, []);

  const completedModules = apiProgress?.completed_modules ?? (!progressLoading && loaded && completed ? 1 : 0);
  const totalModules = apiProgress?.total_modules ?? COURSE_MODULES.length;
  const completedActivities = apiProgress?.completed_activities ?? (!progressLoading && loaded && completed ? 1 : 0);
  const totalActivities = apiProgress?.total_activities ?? COURSE_MODULES.length + 1;
  const progress = progressLoading ? null : apiProgress?.percent_complete ?? (totalActivities ? Math.round(completedActivities / totalActivities * 100) : 0);

  return (
    <div className="dashboard-page detail-page">
      <DashboardHeader active="progress" />
      <main className="dashboard-main">
        <div className="dashboard-breadcrumb"><Link href="/dashboard">My learning</Link><span aria-hidden="true">/</span><strong>Progress</strong><Badge variant="muted">Course preview</Badge></div>
        <section className="dashboard-welcome detail-welcome">
          <div><p className="dashboard-eyebrow">YOUR COURSE</p><h1>Progress and achievements</h1><p>Review your completed modules and pick up where you left off.</p></div>
          <Link className="dashboard-cta" href={progressLoading ? "/dashboard/progress" : completed ? "/dashboard/modules" : "/learn/first-steps"} aria-disabled={progressLoading}>{progressLoading ? "Checking progress…" : completed ? "Browse modules" : "Start first lesson"}<span aria-hidden="true">→</span></Link>
        </section>
        <div className="detail-stat-row">
          <Card className="detail-stat-card"><CardHeader><CardDescription>OVERALL PROGRESS</CardDescription><CardTitle>{progressLoading ? "—" : progress + "%"}</CardTitle></CardHeader><CardContent><p>Lessons and passed knowledge checks</p></CardContent></Card>
          <Card className="detail-stat-card"><CardHeader><CardDescription>MODULES COMPLETED</CardDescription><CardTitle>{progressLoading ? "—" : completedModules} <span>of {totalModules}</span></CardTitle></CardHeader><CardContent><p>{completedModules ? "Your course progress is saved." : "Complete a lesson to get started."}</p></CardContent></Card>
          <Card className="detail-stat-card"><CardHeader><CardDescription>NEXT MILESTONE</CardDescription><CardTitle>{progressLoading ? "—" : completedModules >= totalModules ? "Course complete" : `Module ${completedModules + 1}`}</CardTitle></CardHeader><CardContent><p>{progressLoading ? "Loading saved activity." : completedModules >= totalModules ? "You have completed every course module." : completedModules ? "Continue with the next course lesson." : "Recognise common cyber threats."}</p></CardContent></Card>
        </div>
        <Card className="detail-chart-card">
          <CardHeader className="progress-detail-header"><div><p className="dashboard-eyebrow">COURSE BREAKDOWN</p><CardTitle>Overall completion</CardTitle><CardDescription>Lessons and passed knowledge checks count toward course completion.</CardDescription></div><Badge variant={completedModules ? "success" : "default"}>{progressLoading ? "Loading" : completedModules + " modules complete"}</Badge></CardHeader>
          <CardContent className="detail-donut-content"><ProgressDonut value={progress} completedUnits={completedActivities} totalUnits={totalActivities} unitLabel="activities" /></CardContent>
        </Card>
      </main>
    </div>
  );
}

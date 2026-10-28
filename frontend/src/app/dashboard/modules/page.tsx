"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { COURSE_MODULES, LESSON_PROGRESS_KEY } from "@/lib/course";
import { api, ProgressSummary } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function ModulesPage() {
  const [firstModuleComplete, setFirstModuleComplete] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    const loadProgress = () => api.progress().then(value => { setProgress(value); setFirstModuleComplete(value.items.some(item => item.module_week === 1 && item.status === "completed")); }).catch(() => { setProgress(null); setFirstModuleComplete(window.localStorage.getItem(LESSON_PROGRESS_KEY) === "complete"); }).finally(() => setProgressLoading(false));
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

  return (
    <div className="dashboard-page detail-page">
      <DashboardHeader active="modules" />
      <main className="dashboard-main">
        <div className="dashboard-breadcrumb"><Link href="/dashboard">My learning</Link><span aria-hidden="true">/</span><strong>Modules</strong><Badge variant="muted">4 modules</Badge></div>
        <section className="dashboard-welcome detail-welcome">
          <div><p className="dashboard-eyebrow">COURSE CONTENT</p><h1>Course modules</h1><p>Practical lessons for safer work.</p></div>
          <Button asChild className="dashboard-cta"><Link href="/dashboard/progress">View progress <span aria-hidden="true">→</span></Link></Button>
        </section>
        <div className="module-page-list">
          {COURSE_MODULES.map((module) => {
            const available = module.week === 1;
            const moduleLessons = progress?.items.filter(item => item.module_week === module.week) ?? [];
            const complete = progressLoading ? false : progress ? moduleLessons.length > 0 && moduleLessons.every(item => item.status === "completed") : available && firstModuleComplete;
            const content = <Card className={`module-page-card ${available ? "module-page-card-available" : ""}`}>
              <span className={`module-page-number ${complete ? "module-page-number-complete" : ""}`}>{complete ? "✓" : String(module.week).padStart(2, "0")}</span>
              <CardHeader><Badge variant={complete ? "success" : available ? "default" : "muted"}>{complete ? "Complete" : module.status}</Badge><CardTitle>{module.title}</CardTitle><CardDescription>{module.detail}</CardDescription></CardHeader>
              <CardContent>{available ? <span className="module-page-action">{complete ? "Review lesson" : "Start lesson"}<span aria-hidden="true">→</span></span> : <span className="module-page-action module-page-action-muted">Available soon</span>}</CardContent>
            </Card>;
            const href = module.href ?? `/dashboard/modules/${module.week}`;
            return <Link className="module-page-link" href={href} key={module.week} aria-label={`${complete ? "Review" : "Open"} ${module.title}`}>{content}</Link>;
          })}
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LatestQuizSummary, LearningOverviewSummary, OverviewPractice } from "@/components/dashboard/overview-practice";
import { COURSE_MODULES, LESSON_PROGRESS_KEY } from "@/lib/course";
import { api, ProgressSummary, UserProfile } from "@/services/api";
import { Progress as ShadcnProgress } from "@/components/ui/progress";

export default function DashboardPage() {
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiProgress, setApiProgress] = useState<ProgressSummary | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [greetingPrefix, setGreetingPrefix] = useState("Good morning");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      setGreetingPrefix(hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : "Good evening");
    };
    updateGreeting();
    const greetingTimer = window.setInterval(updateGreeting, 60_000);
    setCompleted(window.localStorage.getItem(LESSON_PROGRESS_KEY) === "complete");
    setLoaded(true);
    api.me().then(setProfile).catch(() => setProfile(null));
    const loadProgress = () => {
      api.progress().then(setApiProgress).catch(() => setApiProgress(null)).finally(() => setProgressLoading(false));
    };
    loadProgress();
    window.addEventListener("focus", loadProgress);
    window.addEventListener("pageshow", loadProgress);
    window.addEventListener("cybersmart:learning-updated", loadProgress);
    const progressTimer = window.setInterval(loadProgress, 30_000);
    return () => {
      window.clearInterval(greetingTimer);
      window.clearInterval(progressTimer);
      window.removeEventListener("focus", loadProgress);
      window.removeEventListener("pageshow", loadProgress);
      window.removeEventListener("cybersmart:learning-updated", loadProgress);
    };
  }, []);

  const localCompleted = !progressLoading && !apiProgress && loaded && completed;
  const completedModules = apiProgress?.completed_modules ?? (localCompleted ? 1 : 0);
  const totalModules = apiProgress?.total_modules ?? COURSE_MODULES.length;
  const completedLessons = apiProgress?.completed_lessons ?? (localCompleted ? 1 : 0);
  const totalLessons = apiProgress?.total_lessons ?? COURSE_MODULES.length;
  const completedActivities = apiProgress?.completed_activities ?? completedLessons;
  const totalActivities = apiProgress?.total_activities ?? totalLessons + 1;
  const progress = progressLoading ? null : apiProgress?.percent_complete ?? (totalActivities ? Math.round(completedActivities / totalActivities * 100) : 0);
  const nextLessonItem = apiProgress?.items.find(item => item.status !== "completed");
  const nextLesson = progressLoading ? null : nextLessonItem
    ? { title: nextLessonItem.lesson_title, week: nextLessonItem.module_week, minutes: nextLessonItem.estimated_minutes ?? null }
    : apiProgress
      ? null
      : localCompleted
        ? { title: "Choose a safe action", week: 2, minutes: 8 }
        : { title: "First steps: spot a suspicious message", week: 1, minutes: 8 };
  const greeting = `${greetingPrefix}${profile ? `, ${profile.full_name.split(" ")[0]}` : ""}`;
  const welcomeName = profile?.full_name.trim().split(/\s+/)[0] ?? "";
  const confettiColors = ["coral", "gold", "jade", "violet", "pink", "blue"];

  return <div className="dashboard-page">
    <DashboardHeader />
    <main className="dashboard-main overview-main" id="dashboard">
      <section className="dashboard-greeting dashboard-welcome" aria-label="Welcome">
        <div className="dashboard-welcome-copy"><span className="dashboard-welcome-kicker"><i aria-hidden="true"/> YOUR LEARNING SPACE</span><h1><span className="sr-only">{greeting}</span><span className="welcome-confetti-text" aria-hidden="true">{Array.from(greetingPrefix).map((letter, index) => <span key={index} className={`welcome-letter welcome-letter-${confettiColors[index % confettiColors.length]}`} style={{ animationDelay: `${index * 35}ms` }}>{letter === " " ? "\u00a0" : letter}</span>)}{welcomeName && <span className="welcome-name">, {Array.from(welcomeName).map((letter, index) => <span key={`${letter}-${index}`} className="welcome-name-letter" style={{ animationDelay: `${index * 55}ms` }}>{letter}</span>)}</span>}</span></h1><p>Small steps make a safer workplace. Pick up where you left off.</p></div>
        <div className="dashboard-welcome-art" aria-hidden="true"><span className="welcome-confetti-piece welcome-confetti-one"/><span className="welcome-confetti-piece welcome-confetti-two"/><span className="welcome-confetti-piece welcome-confetti-three"/><span className="welcome-confetti-piece welcome-confetti-four"/><span className="welcome-confetti-piece welcome-confetti-five"/></div>
      </section>
      <LearningOverviewSummary progress={progress} completedModules={completedModules} totalModules={totalModules} completedLessons={completedLessons} totalLessons={totalLessons} completedActivities={completedActivities} totalActivities={totalActivities} nextLesson={nextLesson} loading={progressLoading}/>

      <section className="overview-panel dashboard-notifications" aria-labelledby="dashboard-notifications-title">
        <div className="dashboard-notifications-heading">
          <div><span className="dashboard-notifications-eyebrow">STAY IN THE LOOP</span><h2 id="dashboard-notifications-title">Notifications</h2><p>Course announcements, learning reminders, and account updates will appear here.</p></div>
          <span className="dashboard-notifications-count" aria-label="No unread notifications">0 new</span>
        </div>
        <div className="dashboard-notifications-empty" role="status">
          <span className="dashboard-notifications-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg></span>
          <div><strong>You’re all caught up</strong><p>We’ll let you know when there’s something new about your learning.</p></div>
        </div>
        <Link className="dashboard-notifications-settings" href="/dashboard/settings">Manage notification preferences <span aria-hidden="true">→</span></Link>
      </section>

      <div className="overview-section-heading course-cards-heading"><div><h2>Course modules</h2><p>Four short modules for safer work.</p></div></div>
      <div className="module-page-list overview-course-list">
        {COURSE_MODULES.map((module) => {
          const moduleItems = apiProgress?.items.filter(item => item.module_week === module.week) ?? [];
          const moduleLessonsTotal = apiProgress ? moduleItems.length : progressLoading ? 0 : 1;
          const moduleLessonsCompleted = apiProgress ? moduleItems.filter(item => item.status === "completed").length : (module.week === 1 && localCompleted ? 1 : 0);
          const isComplete = moduleLessonsTotal > 0 && moduleLessonsCompleted === moduleLessonsTotal;
          const moduleProgress = moduleLessonsTotal ? Math.round(moduleLessonsCompleted / moduleLessonsTotal * 100) : 0;
          const content = <Card className={`module-overview-card module-overview-card-${module.week}`}>
            <div className="module-overview-main"><span className="module-overview-number">{String(module.week).padStart(2, "0")}</span><div className="module-overview-copy"><CardTitle>{module.title}</CardTitle>{isComplete && <span className="module-overview-complete">Complete</span>}</div></div>
            <CardDescription>{module.detail}</CardDescription>
            <CardContent className="module-overview-progress"><strong>{progressLoading ? "—" : moduleLessonsCompleted + " / " + moduleLessonsTotal}</strong><ShadcnProgress className="module-overview-track" value={moduleProgress} label={module.title + " lesson progress"} /></CardContent>
          </Card>;
          const href = module.href;
          return <Link className="module-page-link" href={href} key={module.week} aria-label={`${isComplete ? "Review" : "Open"} ${module.title}`}>{content}</Link>;
        })}
      </div>

      <LatestQuizSummary progress={apiProgress} loading={progressLoading}/>
      <OverviewPractice />
      <footer className="dashboard-footer"><span>CyberSmart Workplace</span><span>Practical learning for safer work</span><a href="#dashboard">Back to top ↑</a></footer>
    </main>
  </div>;
}

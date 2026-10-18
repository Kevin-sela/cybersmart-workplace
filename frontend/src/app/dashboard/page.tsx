"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LatestQuizSummary, LearningOverviewSummary, OverviewPractice } from "@/components/dashboard/overview-practice";
import { COURSE_MODULES, COURSE_PROGRESS, LESSON_PROGRESS_KEY } from "@/lib/course";
import { api, ProgressSummary, UserProfile } from "@/services/api";

export default function DashboardPage() {
  const [completed, setCompleted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiProgress, setApiProgress] = useState<ProgressSummary | null>(null);
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
    api.progress().then(setApiProgress).catch(() => setApiProgress(null));
    return () => window.clearInterval(greetingTimer);
  }, []);

  const completedModules = loaded && completed ? 1 : 0;
  const modulesShown = Math.max(1, completedModules);
  const progress = apiProgress?.percent_complete ?? Math.max(COURSE_PROGRESS, completedModules * COURSE_PROGRESS);
  const greeting = `${greetingPrefix}${profile ? `, ${profile.full_name.split(" ")[0]}` : ""}`;
  const confettiColors = ["coral", "gold", "jade", "violet", "pink", "blue"];

  return <div className="dashboard-page">
    <DashboardHeader />
    <main className="dashboard-main overview-main" id="dashboard">
      <section className="dashboard-greeting dashboard-welcome" aria-label="Welcome">
        <div className="dashboard-welcome-copy"><span className="dashboard-welcome-kicker"><i aria-hidden="true"/> YOUR LEARNING SPACE</span><h1><span className="sr-only">{greeting}</span><span className="welcome-confetti-text" aria-hidden="true">{Array.from(greetingPrefix).map((letter, index) => <span key={index} className={`welcome-letter welcome-letter-${confettiColors[index % confettiColors.length]}`} style={{ animationDelay: `${index * 35}ms` }}>{letter === " " ? "\u00a0" : letter}</span>)}{profile && <span className="welcome-name">, {profile.full_name.split(" ")[0]}</span>}</span></h1><p>Small steps make a safer workplace. Pick up where you left off.</p></div>
        <div className="dashboard-welcome-art" aria-hidden="true"><span className="welcome-confetti-piece welcome-confetti-one"/><span className="welcome-confetti-piece welcome-confetti-two"/><span className="welcome-confetti-piece welcome-confetti-three"/><span className="welcome-confetti-piece welcome-confetti-four"/><span className="welcome-confetti-piece welcome-confetti-five"/></div>
      </section>
      <LearningOverviewSummary progress={progress} completedModules={modulesShown} totalModules={COURSE_MODULES.length}/>

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
          const available = module.week === 1;
          const isComplete = available && completed;
          const moduleProgress = module.week === 1 ? 25 : 0;
          const content = <Card className={`module-overview-card module-overview-card-${module.week}`}>
            <div className="module-overview-main"><span className="module-overview-number">{String(module.week).padStart(2, "0")}</span><span className="module-overview-divider"/><div className="module-overview-copy"><CardTitle>{module.title}</CardTitle>{module.week === 1 && isComplete && <span className="module-overview-complete">Complete</span>}</div></div>
            <CardDescription>{module.detail}</CardDescription>
            <CardContent className="module-overview-progress"><strong>{moduleProgress > 0 ? "1" : "0"} / 4</strong><span className="module-overview-track" role="progressbar" aria-label={`${module.title} progress`} aria-valuenow={moduleProgress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${moduleProgress}%`}}/></span></CardContent>
          </Card>;
          const href = module.href ?? `/dashboard/modules/${module.week}`;
          return <Link className="module-page-link" href={href} key={module.week} aria-label={`${isComplete ? "Review" : "Open"} ${module.title}`}>{content}</Link>;
        })}
      </div>

      <LatestQuizSummary />
      <OverviewPractice />
      <footer className="dashboard-footer"><span>CyberSmart Workplace</span><span>Practical learning for safer work</span><a href="#dashboard">Back to top ↑</a></footer>
    </main>
  </div>;
}

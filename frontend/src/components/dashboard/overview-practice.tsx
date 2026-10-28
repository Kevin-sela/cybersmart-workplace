"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpenText, CheckCircle2, Clock3, Gauge, Sparkles } from "lucide-react";

import { ProgressDonut } from "@/components/dashboard/progress-donut";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressSummary } from "@/services/api";

const choices = ["Check the sender and don’t open it yet", "Open the document to see what it is", "Reply to ask if it’s real", "Forward it to a colleague for advice"];

function SummaryIcon({ kind }: { kind: "book" | "clock" | "chart" }) {
  const icon = {
    book: <BookOpenText className="h-4 w-4" />,
    clock: <Clock3 className="h-4 w-4" />,
    chart: <Gauge className="h-4 w-4" />,
  };
  return icon[kind];
}

export function LearningOverviewSummary({
  progress,
  completedModules,
  totalModules,
  completedLessons,
  totalLessons,
  completedActivities,
  totalActivities,
  nextLesson,
  loading,
}: {
  progress: number | null;
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  completedActivities: number;
  totalActivities: number;
  nextLesson: { title: string; week: number; minutes: number | null } | null;
  loading: boolean;
}) {
  return (
    <section className="dashboard-learning-summary mt-6 grid gap-4 lg:grid-cols-[1.45fr_0.8fr]" aria-label="Learning progress overview">
      <Card className="dashboard-progress-card border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Your progress</CardTitle>
            <Badge variant="muted">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="dashboard-progress-body flex flex-col gap-5 sm:flex-row sm:items-center">
            <ProgressDonut value={progress} completedUnits={completedActivities} totalUnits={totalActivities} unitLabel="activities" showModuleCount={false} />

            <div className="dashboard-progress-stats flex flex-1 flex-col gap-3">
              <div className="dashboard-progress-stat flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SummaryIcon kind="book" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {loading ? "—" : `${completedModules} / ${totalModules}`}
                  </p>
                  <p className="text-xs text-muted-foreground">modules completed</p>
                </div>
              </div>

              <div className="dashboard-progress-stat flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <SummaryIcon kind="clock" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {loading ? "—" : `${completedLessons} / ${totalLessons}`}
                  </p>
                  <p className="text-xs text-muted-foreground">lessons completed</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-next-card border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="pb-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {loading ? "Loading activity" : nextLesson ? `Next lesson · Week ${nextLesson.week}` : "Next step"}
          </p>
        </CardHeader>
        <CardContent className="dashboard-next-content flex h-full flex-col justify-center pt-0">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {loading ? "Preparing…" : nextLesson ? nextLesson.title : "Course complete"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {loading
              ? "Checking your next recommended activity…"
              : nextLesson && nextLesson.minutes
                ? `Estimated time: ${nextLesson.minutes} minutes.`
                : "Keep your security habits strong and review the key reminders in the course."}
          </p>

          <Link
            href="/dashboard/modules"
            className="dashboard-next-action mt-5 inline-flex items-center gap-2 self-start rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground no-underline hover:bg-primary/90"
          >
            View path
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

export function LatestQuizSummary({ progress, loading }: { progress: ProgressSummary | null; loading: boolean }) {
  const latest = progress?.latest_quiz ?? null;
  const totalQuizzes = progress ? Math.max(0, progress.total_activities - progress.total_lessons) : 0;
  const unavailable = !loading && !progress;

  return (
    <section
      className="mt-4 grid gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-sm md:grid-cols-[1.1fr_0.8fr_0.8fr]"
      aria-label="Latest quiz and course progress"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <SummaryIcon kind="chart" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {loading ? "Loading quiz activity…" : unavailable ? "Sign in to view quiz activity" : latest ? (latest.passed ? "Latest quiz passed" : "Latest quiz attempted") : "No quiz yet"}
          </p>
          <p className="text-xs text-muted-foreground">latest score</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xl font-bold tracking-tight text-foreground">
            {loading || unavailable ? "—" : `${progress?.passed_quizzes_count ?? 0} / ${totalQuizzes}`}
          </p>
          <p className="text-xs text-muted-foreground">quizzes passed</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20 text-charcoal">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xl font-bold tracking-tight text-foreground">
            {loading || unavailable ? "—" : progress?.quiz_attempts_count ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">quiz attempts</p>
        </div>
      </div>
    </section>
  );
}

export function OverviewPractice() {
  const [answer, setAnswer] = useState<number | null>(null);

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" aria-label="Practice and discussion">
      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">Daily practice</p>
              <CardTitle className="mt-2 text-xl">Quick judgment check</CardTitle>
            </div>
            <Badge variant="muted">Shared file</Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">New message</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">“Please review this document right away.”</p>
              <p className="mt-2 text-xs text-muted-foreground">The sender address looks unusual and the urgency feels forced.</p>
            </div>

            <div className="space-y-2" role="radiogroup" aria-label="Choose your response">
              {choices.map((choice, index) => (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={answer === index}
                  onClick={() => setAnswer(index)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                    answer === index
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/40"
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${answer === index ? "border-primary bg-primary" : "border-muted-foreground/70"}`}>
                    {answer === index && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <span>{choice}</span>
                </button>
              ))}
            </div>
          </div>

          {answer !== null && (
            <div className={`mt-4 rounded-xl border px-3 py-2.5 text-sm ${answer === 0 ? "border-success/30 bg-success/10 text-success" : "border-error/30 bg-error/10 text-error"}`} aria-live="polite">
              <strong className="font-semibold">{answer === 0 ? "Good first step." : "Not the safest move."}</strong>
              <p className="mt-1 text-sm/5 text-current/80">
                {answer === 0
                  ? "Pause, verify the sender, and confirm the file before you open anything."
                  : "Unexpected urgency and a suspicious document are signs to slow down and check the source first."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Group discussion</CardTitle>
          <CardDescription>Talk through the clues with other learners.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">F</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Facilitator</p>
              <p className="mt-1 text-sm text-foreground">What details would make you pause before opening a message?</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">L</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Learning prompt</p>
              <p className="mt-1 text-sm text-foreground">Look at the sender, unexpected urgency, and whether the file should have been shared this way.</p>
            </div>
          </div>

          <Link
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-foreground px-3.5 py-2 text-sm font-medium text-background no-underline transition hover:bg-foreground/90"
            href="/dashboard/forum"
          >
            Open discussion
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card } from "@/components/ui/card";
import { api, QuizContent, QuizSubmission } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function QuizPage() {
  const [quiz, setQuiz] = useState<QuizContent | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizSubmission | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.finalQuiz().then(setQuiz).catch(e => setError(e instanceof Error ? e.message : "The quiz could not be loaded.")); }, []);

  async function submit() {
    if (!quiz || Object.keys(selected).length !== quiz.questions.length) return;
    setBusy(true); setError("");
    try { setResult(await api.submitFinalQuiz(quiz.questions.map(question => ({ question_id: question.id, selected_option_id: selected[question.id] })))); }
    catch (e) { setError(e instanceof Error ? e.message : "Your answers could not be submitted."); }
    finally { setBusy(false); }
  }

  return <div className="dashboard-page"><DashboardHeader /><main className="dashboard-main detail-page">
    <div className="dashboard-breadcrumb"><Link href="/dashboard">Overview</Link><span>/</span><strong>Knowledge check</strong></div>
    <section className="dashboard-welcome detail-welcome"><div><p className="dashboard-eyebrow">PRACTICE</p><h1>Knowledge check</h1><p>Choose the safest response for each workplace scenario.</p></div></section>
    {error && <p className="account-error" role="alert">{error}{error.toLowerCase().includes("sign in") && <> <Link href="/sign-in?next=%2Fdashboard%2Fquiz">Sign in</Link></>}</p>}
    {!quiz && !error && <Card className="overview-panel quiz-question-card" aria-live="polite">Loading the knowledge check…</Card>}
    {quiz && <>
      <p className="quiz-intro">{quiz.instructions} Passing score: {quiz.pass_mark_percent}%.</p>
      {quiz.questions.map((question, index) => {
        const feedback = result?.feedback.find(item => item.question_id === question.id);
        return <Card className="overview-panel quiz-question-card" key={question.id}><p className="dashboard-eyebrow">QUESTION {index + 1} OF {quiz.questions.length}</p><h2>{question.prompt}</h2>
          <div className="quiz-answer-list">{question.options.map((option, optionIndex) => <button key={option.id} type="button" disabled={Boolean(result)} className={`${selected[question.id] === option.id ? "quiz-answer-selected" : ""} ${feedback?.correct_option_id === option.id ? "quiz-explanation-correct" : ""}`} onClick={() => setSelected(current => ({ ...current, [question.id]: option.id }))}><span>{String.fromCharCode(65 + optionIndex)}</span>{option.text}</button>)}</div>
          {feedback && <div className={`quiz-explanation ${feedback.is_correct ? "quiz-explanation-correct" : ""}`} aria-live="polite"><strong>{feedback.is_correct ? "Correct." : "Review this choice."}</strong><p>{feedback.explanation}</p></div>}
        </Card>;
      })}
      {result ? <Card className="overview-panel quiz-question-card" role="status"><h2>{result.passed ? "Knowledge check passed" : "Keep practising"}</h2><p>You scored {result.score_percent}% ({result.correct_count} of {result.total_questions}). Passing score: {result.pass_mark_percent}%.</p></Card> : <Button className="dashboard-cta quiz-submit-button" type="button" disabled={busy || Object.keys(selected).length !== quiz.questions.length} onClick={submit}>{busy ? "Submitting…" : "Submit answers"}</Button>}
    </>}
    <Link className="discussion-action" href="/dashboard">Back to overview</Link>
  </main></div>;
}

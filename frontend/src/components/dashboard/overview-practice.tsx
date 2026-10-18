"use client";

import Link from "next/link";
import { useState } from "react";
import { ProgressDonut } from "@/components/dashboard/progress-donut";

const choices = ["Check the sender and don’t open it yet", "Open the document to see what it is", "Reply to ask if it’s real", "Forward it to a colleague for advice"];

function SummaryIcon({ kind }: { kind: "book" | "clock" | "chart" }) {
  const icon = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 11h8"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chart: <><path d="M4 19V5m0 14h16"/><path d="m7 15 4-4 3 2 5-6"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icon[kind]}</svg>;
}

export function LearningOverviewSummary({ progress, completedModules, totalModules }: { progress: number; completedModules: number; totalModules: number }) {
  return <section className="learning-summary-grid" aria-label="Learning progress overview">
    <article className="summary-panel progress-overview-panel">
      <div className="summary-panel-heading"><h2>Your progress</h2></div>
      <div className="progress-overview-content"><ProgressDonut value={progress} completedModules={completedModules} totalModules={totalModules} showModuleCount={false}/>
        <div className="progress-overview-stats">
          <div className="progress-overview-stat"><SummaryIcon kind="book"/><p><strong>{completedModules} / {totalModules}</strong><span>modules completed</span></p></div>
          <div className="progress-overview-stat"><SummaryIcon kind="clock"/><p><strong>8 min</strong><span>to next lesson</span></p></div>
        </div>
      </div>
    </article>
    <article className="summary-panel next-lesson-summary"><span className="next-lesson-kicker">NEXT LESSON · 8 MIN</span><h2>Choose safe actions</h2><p>Protect accounts and workplace information.</p><Link href="/dashboard/modules/2" className="next-lesson-button">Continue <span aria-hidden="true">→</span></Link></article>
  </section>;
}

export function LatestQuizSummary() {
  return <section className="latest-quiz-strip" aria-label="Latest quiz and course progress">
    <div className="latest-quiz-result"><span className="latest-quiz-icon"><SummaryIcon kind="chart"/></span><strong>Latest quiz <span>·</span> 80%</strong><span className="latest-quiz-track" role="img" aria-label="Quiz score 80 percent"><i/></span></div>
    <div className="latest-strip-detail"><SummaryIcon kind="book"/><p><strong>1 / 4</strong><span>modules completed</span></p></div>
    <div className="latest-strip-detail"><SummaryIcon kind="clock"/><p><strong>8 min</strong><span>to next lesson</span></p></div>
  </section>;
}

export function OverviewPractice() {
  const [answer, setAnswer] = useState<number | null>(null);
  return <section className="overview-lower-grid" aria-label="Practice and discussion">
    <article className="overview-panel daily-practice-panel"><div className="overview-panel-heading practice-heading"><svg className="practice-envelope-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m4 7 8 6 8-6"/></svg><div><h2>Daily practice: spot the phish</h2><p>Choose a safe first step for this message.</p></div><span className="practice-tag">1 min</span></div>
      <div className="daily-practice-content"><div className="practice-message"><span>NEW MESSAGE · SHARED FILE</span><p>“Please review this document right away.”</p><small>The sender address looks unfamiliar.</small></div>
        <div className="practice-options" role="radiogroup" aria-label="Choose your response">{choices.map((choice,index)=><button type="button" role="radio" aria-checked={answer===index} className={`practice-option ${answer===index?"practice-option-selected":""} ${answer!==null&&index===0?"practice-option-correct":""} ${answer===index&&index!==0?"practice-option-incorrect":""}`} onClick={()=>setAnswer(index)} key={choice}><span className="practice-radio" aria-hidden="true">{answer===index&&<i/>}</span>{choice}</button>)}</div></div>
      {answer!==null&&<div className={`practice-feedback ${answer===0?"practice-feedback-good":"practice-feedback-bad"}`} aria-live="polite"><strong>{answer===0?"Good first step.":"Not the safest step."}</strong><span>Verify the sender through a trusted channel, then report anything suspicious.</span></div>}
    </article>
    <article className="overview-panel discussion-panel"><div className="overview-panel-heading"><div><h2>Group discussion</h2><p>Talk through the clues with other learners.</p></div></div>
      <div className="discussion-prompt"><span className="discussion-avatar">F</span><div><strong>Facilitator</strong><p>What details would make you pause before opening a message?</p></div></div>
      <div className="discussion-prompt"><span className="discussion-avatar discussion-avatar-learner">L</span><div><strong>Learning prompt</strong><p>Look at the sender, unexpected urgency, and where a link leads.</p></div></div>
      <Link className="discussion-action" href="/dashboard/forum">Open discussion <span aria-hidden="true">→</span></Link>
    </article>
  </section>;
}

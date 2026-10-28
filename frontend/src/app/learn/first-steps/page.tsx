"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { CourseVideoCard } from "@/components/course/course-video-card";
import { api } from "@/services/api";

export default function LessonPage() {
  const [complete, setComplete] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    startedAt.current = performance.now();
    api.progress().then(progress => {
      const lessonComplete = progress.items.some(item => item.lesson_slug === "first-steps" && item.status === "completed");
      if (lessonComplete) { setComplete(true); setConfirmed(true); }
    }).catch(() => {
      if (window.localStorage.getItem("cybersmart-lesson-1") === "complete") { setComplete(true); setConfirmed(true); }
    });
  }, []);

  async function markComplete() {
    if (complete || saving) return;
    setSaving(true);
    const elapsedSeconds = Math.max(1, Math.round((performance.now() - startedAt.current) / 1000));
    try {
      const lesson = await api.lesson("first-steps");
      await api.updateLessonProgress(lesson.id, { status: "completed", time_spent_seconds: elapsedSeconds });
    } catch {
      // Keep the preview usable while signed out; signed-in learners save progress server-side.
    }
    window.localStorage.setItem("cybersmart-lesson-1", "complete");
    setComplete(true);
    setConfirmed(true);
    setSaving(false);
  }

  return <div className="lesson-shell">
    <header className="lesson-top"><Link className="lesson-brand" href="/"><span className="brand-mark" aria-hidden="true">✓</span><span>CyberSmart <span>Workplace</span></span></Link><Link className="back-link" href="/dashboard">← <span>Back to dashboard</span></Link></header>
    <main className="lesson-main">
      <div className="lesson-breadcrumb"><Link href="/dashboard">Dashboard</Link><span>/</span><span>Week 1</span><span>/</span><span>Lesson 1</span></div>
      <div className="lesson-layout">
        <article className="lesson-article">
          <div className="lesson-kicker"><span>Week 1</span><span>·</span><span>8 min read</span></div>
          <h1>First steps: spot a suspicious message</h1>
          <p className="lesson-lede">A few moments of careful checking can protect your account, your colleagues, and your workplace.</p>
          <div className="lesson-callout"><span aria-hidden="true">i</span><p><strong>Learning goal</strong> · Identify common warning signs and choose a safe way to verify a request.</p></div>
          <CourseVideoCard week={1} title="Recognise threats" description="Spot phishing signs and suspicious links." />
          <h2>Pause before you act</h2>
          <p>A phishing message tries to persuade you to share information, open a file, or visit a website. It may arrive by email, text, or workplace chat. The message can look routine, so pause and check it before acting.</p>
          <h2 id="spot-clues">Look for the clues</h2>
          <ol className="clue-list"><li><span className="clue-number">01</span><div><strong>An unexpected request</strong><p>The message asks you to sign in, share a code, pay an invoice, or act urgently.</p></div></li><li><span className="clue-number">02</span><div><strong>A sender that does not quite match</strong><p>Check the full address or account name, not only the display name.</p></div></li><li><span className="clue-number">03</span><div><strong>A link that leads somewhere unexpected</strong><p>On a computer, hover to preview the destination. When unsure, use a trusted bookmark or contact the organisation through a known channel.</p></div></li><li><span className="clue-number">04</span><div><strong>An unusual attachment</strong><p>Do not open an unexpected file just because the message looks familiar.</p></div></li><li><span className="clue-number">05</span><div><strong>Pressure or secrecy</strong><p>A request to skip normal checks is a reason to slow down.</p></div></li></ol>
          <div className="lesson-tip"><span className="tip-icon" aria-hidden="true">✦</span><p><strong>Remember</strong><br />A familiar logo or a colleague’s name is not proof that a message is genuine. Verify through a channel you already trust.</p></div>
          <h2 id="what-to-do">What to do</h2>
          <p>Do not reply, open the attachment, or follow the link while you are unsure. Verify the request using a contact method you already trust, and follow your workplace process for reporting suspicious messages. If you already clicked or shared information, contact your IT or security team promptly.</p>
          <section className="quick-check" id="quick-check"><p className="eyebrow">Quick check</p><h2>What is the safest first step?</h2><p>You receive an unexpected message saying your account will close in ten minutes unless you sign in through its link.</p><details><summary>Show a safe response</summary><p>Pause. Do not use the link. Go to the service through a known bookmark or contact your IT team using a trusted channel.</p></details></section>
          <div className="lesson-complete-row"><div>{confirmed && <p className="saved-message" role="status">✓ Lesson progress saved on this device.</p>}<p className="completion-hint">You can revisit this lesson whenever you need a reminder.</p></div><Button className={`button ${complete ? "button-done" : "button-primary"}`} type="button" disabled={saving || complete} onClick={markComplete}>{saving ? "Saving…" : complete ? "Lesson completed ✓" : "Mark lesson complete →"}</Button></div>
        </article>
        <aside className="lesson-aside"><section className="lesson-outline"><p className="eyebrow">In this lesson</p><a className="outline-active" href="#spot-clues">01 &nbsp; Spot the clues</a><a href="#what-to-do">02 &nbsp; What to do</a><a href="#quick-check">03 &nbsp; Quick check</a><div className="outline-divider"/><p className="outline-meta"><span>◷</span> About 8 minutes</p><p className="outline-meta"><span>▤</span> Text lesson</p></section><section className="download-card"><p className="eyebrow">Low data?</p><h2>Read it offline</h2><p>Download a small plain-text copy of this lesson.</p><a href="/lesson-one.txt" download>Download text <span aria-hidden="true">↓</span></a></section></aside>
      </div>
      <nav className="lesson-bottom-nav" aria-label="Lesson navigation"><Link href="/dashboard">← Dashboard</Link><span>Week 1 · Lesson 1 of 1</span><Link href="/dashboard">Course overview →</Link></nav>
    </main>
  </div>;
}

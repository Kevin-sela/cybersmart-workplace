"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card } from "@/components/ui/card";
import { api, GroupTask } from "@/services/api";
import { Button } from "@/components/ui/button";

export default function GroupTaskPage() {
  const [task, setTask] = useState<GroupTask | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.groupTask().then(value => { setTask(value); if (value.saved_at) setChecked(value.steps); }).catch(e => setError(e instanceof Error ? e.message : "The activity could not be loaded.")); }, []);
  const toggle = (step: string) => setChecked(current => current.includes(step) ? current.filter(item => item !== step) : [...current, step]);
  async function save() {
    setBusy(true); setError(""); setMessage("");
    try { const saved = await api.saveGroupTask({ steps: checked }); setTask(saved); setMessage("Your checklist has been saved to your learner account."); }
    catch (e) { setError(e instanceof Error ? e.message : "Your checklist could not be saved."); }
    finally { setBusy(false); }
  }
  return <div className="dashboard-page"><DashboardHeader /><main className="dashboard-main detail-page">
    <div className="dashboard-breadcrumb"><Link href="/dashboard">Overview</Link><span>/</span><strong>Group activity</strong></div>
    <section className="dashboard-welcome detail-welcome"><div><p className="dashboard-eyebrow">PRACTICE TOGETHER</p><h1>{task?.title ?? "Build a response checklist"}</h1><p>{task?.brief ?? "Use these steps when a message feels suspicious."}</p></div></section>
    {error && <p className="account-error" role="alert">{error}{error.toLowerCase().includes("sign in") && <> <Link href="/sign-in?next=%2Fdashboard%2Fgroup-task">Sign in</Link></>}</p>}
    <Card className="overview-panel task-checklist-card"><div className="overview-panel-heading"><div><h2>Our safe response</h2><p>Select the steps you would include in your team checklist.</p></div><span>{checked.length} of {task?.steps.length ?? 0}</span></div>
      {!task && !error ? <p aria-live="polite">Loading activity…</p> : <div className="task-checklist">{(task?.steps ?? []).map((step) => <label key={step}><input type="checkbox" checked={checked.includes(step)} onChange={() => toggle(step)} /><span>{step}</span></label>)}</div>}
      <p className="task-checklist-note" aria-live="polite">{message || (checked.length === (task?.steps.length ?? 0) && task ? "Checklist complete. Save your response when you are ready." : "Your selection is saved to your learner account when you submit it.")}</p>
      {task && <Button className="dashboard-cta quiz-submit-button" type="button" onClick={save} disabled={busy || checked.length === 0}>{busy ? "Saving…" : "Save checklist"}</Button>}
    </Card><Link className="discussion-action" href="/dashboard">Back to overview</Link>
  </main></div>;
}

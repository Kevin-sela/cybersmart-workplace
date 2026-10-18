"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function SettingsPage() {
  const [reminders, setReminders] = useState(false);
  return <div className="dashboard-page"><DashboardHeader/><main className="dashboard-main detail-page">
    <div className="dashboard-greeting"><h1>Settings</h1><p>Manage your learning preferences.</p></div>
    <section className="overview-panel settings-preferences"><h2>Learning reminders</h2><p>Choose whether you want a reminder to return to your course.</p><label><span><strong>Weekly reminder</strong><small>A gentle prompt to continue learning.</small></span><input type="checkbox" checked={reminders} onChange={event=>setReminders(event.target.checked)}/></label><p className="settings-note" aria-live="polite">{reminders?"Weekly reminders are enabled for this preview.":"Weekly reminders are turned off."}</p></section>
  </main></div>;
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileAvatar } from "@/components/account/profile-chip";
import { api, ProgressSummary, UserProfile } from "@/services/api";

function accountDate(value: string | null | undefined): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(date);
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.profile().then(setUser).catch(() => setError("Please sign in to view your profile."));
    api.progress().then(setProgress).catch(() => setProgress(null));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await api.updateProfile({ full_name: String(data.get("full_name")), bio: String(data.get("bio")).trim() || null, locale: String(data.get("locale")) });
      setUser(updated);
      setMessage("Your profile has been saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await api.signOut();
      router.replace("/sign-in");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign out.");
    }
  }

  const progressPercent = Math.min(100, Math.max(0, progress?.percent_complete ?? 0));

  return <div className="dashboard-page">
    <DashboardHeader />
    <main className="dashboard-main detail-page profile-settings-page">
      <header className="profile-settings-heading"><p className="account-eyebrow">ACCOUNT SETTINGS</p><h1>Profile</h1><p>Manage your identity, preferences, and learning details.</p></header>
      {!user && !error && <section className="profile-settings-loading" aria-live="polite">Loading your profile…</section>}
      {error && !user && <section className="profile-settings-loading"><p role="alert">{error}</p><a href="/sign-in?next=%2Fdashboard%2Fprofile">Sign in</a></section>}
      {user && <div className="profile-settings-layout">
        <aside className="profile-settings-rail" aria-label="Profile overview">
          <div className="profile-rail-label">YOUR ACCOUNT</div>
          <div className="profile-rail-identity"><ProfileAvatar name={user.full_name} status className="profile-rail-avatar"/><h2>{user.full_name}</h2><p>{user.email}</p><span className="profile-rail-role">{user.role}</span></div>
          <nav className="profile-settings-nav" aria-label="Profile settings navigation"><a href="#personal-info" className="profile-settings-nav-active">Personal info</a><a href="#preferences">Preferences</a><a href="#account-details">Account details</a><a href="#learning-progress">Learning progress</a></nav>
          <section className="profile-rail-progress" id="learning-progress" aria-labelledby="profile-progress-title">
            <div className="profile-rail-progress-heading"><span id="profile-progress-title">Learning progress</span><strong>{progress ? `${progressPercent}%` : "—"}</strong></div>
            <div className="profile-progress-track" role="progressbar" aria-label="Course completion" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progressPercent}%` }}/></div>
            <p>{progress ? `${progress.completed_lessons} of ${progress.total_lessons} lessons completed` : "Your course progress will appear here."}</p>
          </section>
          <span className="profile-rail-footnote">Your profile is private to your account.</span>
        </aside>

        <div className="profile-settings-main">
          <form onSubmit={save} className="profile-settings-form">
            <section className="profile-settings-section" id="personal-info"><div className="profile-section-copy"><span className="profile-section-eyebrow">PROFILE</span><h2>Personal info</h2><p>Choose how your name appears across your learning space.</p></div>
              <div className="profile-fields"><label>Full name<input name="full_name" defaultValue={user.full_name} minLength={2} maxLength={120} required autoComplete="name"/></label><label>About you<textarea name="bio" defaultValue={user.bio ?? ""} maxLength={280} rows={4} placeholder="Share a little about your learning goals"/><small>Up to 280 characters. This helps personalise your learner profile.</small></label></div>
            </section>
            <section className="profile-settings-section" id="preferences"><div className="profile-section-copy"><span className="profile-section-eyebrow">PREFERENCES</span><h2>Language</h2><p>Set the language code for your learning experience.</p></div><div className="profile-fields"><label>Language or locale<input name="locale" defaultValue={user.locale} minLength={2} maxLength={16} placeholder="en"/><small>For example, en, en-GB, or fr.</small></label></div></section>
            <div className="profile-settings-actions">{error && <p className="account-error" role="alert">{error}</p>}{message && <p className="account-success" role="status">{message}</p>}<button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
          </form>

          <section className="profile-account-card" id="account-details" aria-labelledby="profile-account-title"><div className="profile-section-copy"><span className="profile-section-eyebrow">ACCOUNT</span><h2 id="profile-account-title">Account details</h2><p>Information associated with your CyberSmart account.</p></div><dl className="profile-account-details"><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Account type</dt><dd className="profile-capitalize">{user.role}</dd></div><div><dt>Member since</dt><dd>{accountDate(user.created_at)}</dd></div><div><dt>Profile last updated</dt><dd>{accountDate(user.profile_updated_at)}</dd></div></dl></section>

          <section className="profile-session-card" aria-labelledby="profile-session-title"><div><span className="profile-section-eyebrow">SECURITY</span><h2 id="profile-session-title">Current session</h2><p>You’re signed in on this device. Sign out when you’re using a shared computer.</p></div><button type="button" onClick={signOut}>Sign out</button></section>
        </div>
      </div>}
    </main>
  </div>;
}

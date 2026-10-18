"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { api, UserProfile } from "@/services/api";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => { api.me().then(setUser).catch(() => setError("Please sign in to view your profile.")); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return;
    const data = new FormData(event.currentTarget); setBusy(true); setError(""); setMessage("");
    try { const updated = await api.updateProfile({ full_name: String(data.get("full_name")), bio: String(data.get("bio")).trim() || null, locale: String(data.get("locale")) }); setUser(updated); setMessage("Your profile has been saved."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save your profile."); }
    finally { setBusy(false); }
  }
  async function signOut() { try { await api.signOut(); router.replace("/sign-in"); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Could not sign out."); } }
  return <div className="dashboard-page"><DashboardHeader/><main className="dashboard-main detail-page profile-settings-page">
    <header className="profile-settings-heading"><p className="account-eyebrow">ACCOUNT</p><h1>Profile</h1><p>Manage your personal details and learning profile.</p></header>
    {!user && !error && <section className="profile-settings-loading" aria-live="polite">Loading your profile…</section>}
    {error && !user && <section className="profile-settings-loading"><p role="alert">{error}</p><a href="/sign-in?next=%2Fdashboard%2Fprofile">Sign in</a></section>}
    {user && <div className="profile-settings-content">
      <section className="profile-identity"><span className="profile-avatar" aria-hidden="true">{user.full_name.slice(0,1).toUpperCase()}</span><div><h2>{user.full_name}</h2><p>{user.email}</p></div><span className="profile-role">Learner</span></section>
      <form onSubmit={save} className="profile-settings-form">
        <section className="profile-settings-section"><div className="profile-section-copy"><h2>Personal details</h2><p>These details are used on your learning profile.</p></div>
          <div className="profile-fields"><label>Full name<input name="full_name" defaultValue={user.full_name} minLength={2} maxLength={120} required /></label><label>Email address<input value={user.email} readOnly /><small>Email address can’t be changed here.</small></label><label>About you<textarea name="bio" defaultValue={user.bio ?? ""} maxLength={280} rows={3} placeholder="Share a little about your learning goals"/><small>Up to 280 characters.</small></label></div>
        </section>
        <section className="profile-settings-section"><div className="profile-section-copy"><h2>Preferences</h2><p>Choose the language used in your learning experience.</p></div><div className="profile-fields"><label>Language<input name="locale" defaultValue={user.locale} maxLength={16} placeholder="en" /></label></div></section>
        <div className="profile-settings-actions">{error && <p className="account-error" role="alert">{error}</p>}{message && <p className="account-success" role="status">{message}</p>}<button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
      </form>
      <section className="profile-danger-zone"><div><h2>Sign out</h2><p>Sign out of your CyberSmart account on this device.</p></div><button type="button" onClick={signOut}>Sign out</button></section>
    </div>}
  </main></div>;
}

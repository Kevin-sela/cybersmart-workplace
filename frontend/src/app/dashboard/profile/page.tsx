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
  return <div className="dashboard-page"><DashboardHeader/><main className="dashboard-main detail-page"><div className="dashboard-greeting"><p className="account-eyebrow">YOUR ACCOUNT</p><h1>Profile</h1><p>Manage your learner details.</p></div>
    {!user && !error && <section className="overview-panel account-profile-panel" aria-live="polite">Loading your profile…</section>}
    {error && !user && <section className="overview-panel account-profile-panel"><p role="alert">{error}</p><a href="/sign-in?next=%2Fdashboard%2Fprofile">Sign in</a></section>}
    {user && <section className="overview-panel account-profile-panel"><div className="profile-summary"><span className="profile-avatar" aria-hidden="true">{user.full_name.slice(0,1).toUpperCase()}</span><div><h2>{user.full_name}</h2><p>{user.email} · Learner</p></div></div>
      <form onSubmit={save} className="account-form"><label>Full name<input name="full_name" defaultValue={user.full_name} minLength={2} maxLength={120} required /></label><label>Email address<input value={user.email} readOnly /></label><label>About you<textarea name="bio" defaultValue={user.bio ?? ""} maxLength={280} rows={4} /><small>Up to 280 characters.</small></label><label>Language<input name="locale" defaultValue={user.locale} maxLength={16} /></label>
        {error && <p className="account-error" role="alert">{error}</p>}{message && <p className="account-success" role="status">{message}</p>}<button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></form><button className="account-signout" type="button" onClick={signOut}>Sign out</button>
    </section>}
  </main></div>;
}

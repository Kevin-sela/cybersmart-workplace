"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/services/api";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"email" | "credentials">("email");
  const [email, setEmail] = useState("");
  const signUp = mode === "sign-up";
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    setGoogleError(new URLSearchParams(window.location.search).get("error") ?? "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    if (step === "email") {
      const nextEmail = String(form.get("email") ?? "").trim();
      setEmail(nextEmail);
      setStep("credentials");
      return;
    }
    setBusy(true);
    try {
      if (signUp) await api.signUp({ email, full_name: String(form.get("full_name")), password: String(form.get("password")), confirm_password: String(form.get("confirm_password")) });
      else await api.signIn(email, String(form.get("password")));
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.replace(next?.startsWith("/dashboard") ? next : "/dashboard");
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="account-page"><section className="account-card" aria-labelledby="account-title">
    <Link href="/" className="account-brand"><span aria-hidden="true">✦</span> CyberSmart <small>WORKPLACE LEARNING</small></Link>
    <p className="account-eyebrow">LEARNER ACCOUNT</p>
    <h1 id="account-title">{step === "email" ? (signUp ? "Create your account" : "Welcome back") : (signUp ? "Create a password" : "Enter your password")}</h1>
    <p className="account-intro">{step === "email" ? (signUp ? "Learn practical ways to make safer choices at work." : "Sign in to continue your CyberSmart learning.") : "Your account is protected with a secure sign-in."}</p>
    {googleError && step === "email" && <p className="account-error" role="alert">{googleError === "google_unavailable" ? "Google sign-in is not configured yet. Use email, or add OAuth credentials to the backend settings." : "Google sign-in could not be completed. Please try again or use email."}</p>}
    {step === "email" && <>
      <a className="google-auth-button" href="/api/identity/google/start?next=%2Fdashboard"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.2c0-.7-.06-1.38-.18-2.03H12v3.84h5.24a4.48 4.48 0 0 1-1.95 2.94v2.4h3.16c1.85-1.7 2.9-4.2 2.9-7.15Z"/><path fill="#34A853" d="M12 21.7c2.64 0 4.86-.87 6.48-2.35l-3.16-2.4c-.87.58-1.98.93-3.32.93-2.55 0-4.72-1.72-5.5-4.04H3.24v2.48A9.8 9.8 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M6.5 13.84a5.9 5.9 0 0 1 0-3.68V7.68H3.24a9.8 9.8 0 0 0 0 8.64l3.26-2.48Z"/><path fill="#EA4335" d="M12 6.12c1.44 0 2.73.5 3.75 1.5l2.82-2.82A9.4 9.4 0 0 0 12 2.3a9.8 9.8 0 0 0-8.76 5.38L6.5 10.16c.78-2.32 2.95-4.04 5.5-4.04Z"/></svg><span>Continue with Google</span></a>
      <div className="account-divider"><span>or continue with email</span></div>
    </>}
    <form onSubmit={submit} className="account-form">
      {step === "email" ? <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} required autoFocus /></label> : <>
        <div className="account-email-row"><span>{email}</span><button type="button" onClick={() => { setStep("email"); setError(""); }}>Change</button></div>
        {signUp && <label>Full name<input name="full_name" autoComplete="name" minLength={2} maxLength={120} required autoFocus /></label>}
        <label>Password<input name="password" type="password" autoComplete={signUp ? "new-password" : "current-password"} minLength={signUp ? 12 : 1} maxLength={128} required autoFocus={!signUp} />{signUp && <small>Use at least 12 characters.</small>}</label>
        {signUp && <label>Confirm password<input name="confirm_password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>}
      </>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? "Please wait…" : step === "email" ? "Continue" : signUp ? "Create account" : "Sign in"}</button>
    </form>
    <p className="account-switch">{signUp ? "Already have an account?" : "New to CyberSmart?"} <Link href={signUp ? "/sign-in" : "/sign-up"}>{signUp ? "Sign in" : "Create an account"}</Link></p>
    <p className="account-terms">By continuing, you agree to use CyberSmart Workplace responsibly.</p>
  </section></main>;
}

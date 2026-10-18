import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";
export default function SignInPage() { return <Suspense fallback={<main className="account-page"><p>Loading sign-in…</p></main>}><AuthForm mode="sign-in" /></Suspense>; }

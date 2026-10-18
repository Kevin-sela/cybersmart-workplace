import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";
export default function SignUpPage() { return <Suspense fallback={<main className="account-page"><p>Loading registration…</p></main>}><AuthForm mode="sign-up" /></Suspense>; }

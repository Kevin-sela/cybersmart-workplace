import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";
export default function SignInPage() { return <Suspense fallback={<main className="grid min-h-svh place-items-center bg-white px-5 py-10"><p>Loading sign-in…</p></main>}><AuthForm mode="sign-in" /></Suspense>; }

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const roleErrorMessage =
  "This account is not an admin. Add this email to public.admin_emails in Supabase SQL Editor.";

type AuthMode = "signin" | "signup";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => (typeof window === "undefined" ? null : createClient()), []);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "not_admin") {
      setError(roleErrorMessage);
    }
  }, []);

  function getSupabaseClient() {
    if (!supabase) {
      throw new Error("Supabase client is not ready.");
    }
    return supabase;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");

    try {
      const client = getSupabaseClient();

      if (mode === "signup") {
        const { error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        setNotice("Account created. If email confirmation is enabled, verify your email, then sign in.");
        setMode("signin");
        return;
      }

      const { error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError || !user) {
        throw new Error("Authentication succeeded but user session was not found.");
      }

      const normalizedEmail = user.email?.toLowerCase();
      if (!normalizedEmail) {
        await client.auth.signOut();
        throw new Error(roleErrorMessage);
      }

      const { data: adminRow, error: adminError } = await client
        .from("admin_emails")
        .select("email")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (adminError || !adminRow) {
        await client.auth.signOut();
        throw new Error(roleErrorMessage);
      }

      router.replace("/admin");
      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to sign in.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
      <section className="w-full rounded-2xl border border-line bg-panel/80 p-7">
        <p className="font-heading text-5xl text-paper">Gym Auth</p>
        <p className="mt-2 text-sm text-muted">
          Sign in or create an account. Dashboard access is still limited to admin emails.
        </p>

        <div className="mt-6 inline-flex rounded-full border border-line bg-black/30 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
              setNotice("");
            }}
            className={`rounded-full px-4 py-2 text-sm ${mode === "signin" ? "bg-accent text-black" : "text-muted"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setNotice("");
            }}
            className={`rounded-full px-4 py-2 text-sm ${mode === "signup" ? "bg-accent text-black" : "text-muted"}`}
          >
            Sign up
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-sm text-paper outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-sm text-paper outline-none focus:border-accent"
              required
            />
          </label>
          {mode === "signup" ? (
            <p className="text-xs text-muted">
              Password should be at least 6 characters (or follow your Supabase Auth password policy).
            </p>
          ) : null}
          {notice ? <p className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-xs text-accent">{notice}</p> : null}
          {error ? <p className="rounded-lg border border-accent-2/50 bg-accent-2/10 px-3 py-2 text-xs text-accent-2">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent/85 disabled:opacity-60"
          >
            {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <Link href="/" className="mt-4 inline-block text-xs text-muted underline-offset-4 hover:underline">
          Back to website
        </Link>
      </section>
    </main>
  );
}

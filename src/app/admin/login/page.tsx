"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "signup";

const notAdminMessage = "Signed in, but this account is not admin. Admin dashboard is restricted.";

type AuthResponse = {
  user?: {
    id: string;
    email: string;
    role: "admin" | "customer";
    name: string;
  };
  message?: string;
};

async function parseJson(response: Response) {
  try {
    return (await response.json()) as AuthResponse;
  } catch {
    return {} as AuthResponse;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "not_admin") {
      setError(notAdminMessage);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        mode === "signup"
          ? {
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
            }
          : {
              email: email.trim().toLowerCase(),
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      if (data.user?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

      router.refresh();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Authentication failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
      <section className="w-full rounded-2xl border border-line bg-panel/80 p-7">
        <p className="font-heading text-5xl text-accent">ESPACE FITNESS SM</p>

        <div className="mt-6 inline-flex rounded-full border border-line bg-black/30 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            className={`rounded-full px-4 py-2 text-sm ${mode === "signin" ? "bg-accent-2 text-paper" : "text-muted"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`rounded-full px-4 py-2 text-sm ${mode === "signup" ? "bg-accent-2 text-paper" : "text-muted"}`}
          >
            Sign up
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-sm text-paper outline-none focus:border-accent"
                required
              />
            </label>
          ) : null}
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
          {error ? <p className="rounded-lg border border-accent-2/50 bg-accent-2/10 px-3 py-2 text-xs text-accent-2">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-accent-2 px-4 py-2 text-sm font-semibold text-paper hover:bg-accent-2/85 disabled:opacity-60"
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

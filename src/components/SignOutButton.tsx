"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SignOutButtonProps = {
  className?: string;
};

export default function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={busy} className={className}>
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}

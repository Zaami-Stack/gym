"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SignOutButton from "@/components/SignOutButton";

type MainNavProps = {
  isAdmin: boolean;
  hasSession: boolean;
  instagramUrl: string;
};

const navItems = [
  { href: "#programs", label: "Programmes" },
  { href: "#gallery", label: "Galerie" },
  { href: "#visit", label: "Tarifs" },
  { href: "#contact", label: "Contact" },
];

type AuthActionProps = {
  isAdmin: boolean;
  hasSession: boolean;
  mobile?: boolean;
};

function AuthAction({ isAdmin, hasSession, mobile = false }: AuthActionProps) {
  const baseClass = mobile
    ? "inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold"
    : "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold";

  if (isAdmin) {
    return (
      <Link
        href="/admin"
        className={`${baseClass} border-accent-2/70 bg-accent-2/20 text-paper transition hover:bg-accent-2/30`}
      >
        Dashboard
      </Link>
    );
  }

  if (hasSession) {
    return (
      <SignOutButton
        className={`${baseClass} border-paper/30 text-paper transition hover:border-accent-2 hover:text-paper disabled:opacity-60`}
      />
    );
  }

  return (
    <Link
      href="/admin/login"
      className={`${baseClass} border-paper/30 text-paper transition hover:border-accent-2 hover:text-paper`}
    >
      Sign in / Sign up
    </Link>
  );
}

export default function MainNav({ isAdmin, hasSession, instagramUrl }: MainNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-2xl tracking-[0.14em] text-accent sm:text-3xl md:text-4xl">ESPACE FITNESS SM</p>

          <div className="hidden md:block">
            <AuthAction isAdmin={isAdmin} hasSession={hasSession} />
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex items-center justify-center rounded-lg border border-paper/30 px-3 py-2 text-sm font-semibold text-paper transition hover:border-accent-2 md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <div className="mt-3 hidden items-center gap-4 text-sm text-muted md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-paper">
              {item.label}
            </a>
          ))}
          <a href={instagramUrl} target="_blank" rel="noreferrer" className="transition hover:text-paper">
            Instagram
          </a>
        </div>
      </div>

      {menuOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/45"
          />
          <div id="mobile-nav" className="absolute left-0 right-0 z-50 border-t border-line bg-ink px-4 py-4 shadow-2xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg border border-line/50 bg-white/5 px-3 py-2 text-sm text-paper transition hover:border-accent-2"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg border border-line/50 bg-white/5 px-3 py-2 text-sm text-paper transition hover:border-accent-2"
              >
                Instagram
              </a>
              <div className="pt-2">
                <AuthAction isAdmin={isAdmin} hasSession={hasSession} mobile />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

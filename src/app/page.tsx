/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { getPublicContent } from "@/lib/content";

const featureCards = [
  {
    title: "Strength Lab",
    text: "Olympic platforms, calibrated plates, and smart programming to help you lift with purpose.",
  },
  {
    title: "Conditioning Arena",
    text: "HIIT lanes, sled tracks, and guided circuits for speed, stamina, and body transformation.",
  },
  {
    title: "Recovery Zone",
    text: "Mobility classes, guided stretch blocks, and recovery protocols to keep your progress consistent.",
  },
];

const classHours = [
  { day: "Monday", time: "6:00 AM - 10:00 PM" },
  { day: "Tuesday", time: "6:00 AM - 10:00 PM" },
  { day: "Wednesday", time: "6:00 AM - 10:00 PM" },
  { day: "Thursday", time: "6:00 AM - 10:00 PM" },
  { day: "Friday", time: "6:00 AM - 9:00 PM" },
  { day: "Saturday", time: "7:00 AM - 8:00 PM" },
  { day: "Sunday", time: "8:00 AM - 4:00 PM" },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const { settings, gallery, notifications, isAdmin } = await getPublicContent();

  return (
    <main className="min-h-screen pb-16">
      {notifications.length > 0 ? (
        <div className="border-y border-line bg-black/40 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 text-sm text-accent">
            <p className="font-heading text-2xl text-accent-2">Alerts</p>
            {notifications.map((notification) => (
              <span key={notification.id} className="rounded-full border border-accent/40 px-3 py-1 text-xs md:text-sm">
                {notification.message}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <section className="px-4 pt-4 md:px-8">
        <div
          className="mx-auto min-h-[74vh] max-w-7xl overflow-hidden rounded-3xl border border-line/60"
          style={{
            backgroundImage: `linear-gradient(110deg, rgb(2 6 12 / 92%) 0%, rgb(2 6 12 / 68%) 40%, rgb(2 6 12 / 84%) 100%), url(${settings.hero_image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex h-full flex-col px-6 pb-10 pt-6 md:px-12 md:pb-12 md:pt-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-heading text-4xl tracking-[0.2em] text-paper md:text-5xl">Iron Temple</p>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-full border border-paper/30 px-4 py-2 text-sm text-paper transition hover:border-accent hover:text-accent"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="rounded-full border border-paper/30 px-4 py-2 text-sm text-paper transition hover:border-accent hover:text-accent"
                >
                  Sign in / Sign up
                </Link>
              )}
            </header>

            <div className="mt-12 max-w-3xl md:mt-24">
              <h1 className="font-heading text-5xl leading-none text-paper md:text-7xl">{settings.hero_title}</h1>
              <p className="mt-5 max-w-2xl text-base text-muted md:text-lg">{settings.hero_subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#programs"
                  className="rounded-full bg-accent px-6 py-3 font-semibold text-black transition hover:bg-accent/85"
                >
                  Explore Programs
                </a>
                <a
                  href="#visit"
                  className="rounded-full border border-paper/40 px-6 py-3 font-semibold text-paper transition hover:border-accent hover:text-accent"
                >
                  Visit Today
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="mx-auto mt-16 grid max-w-7xl gap-5 px-4 md:grid-cols-3 md:px-8">
        {featureCards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-line bg-panel/70 p-6 backdrop-blur">
            <h2 className="font-heading text-3xl text-accent-2">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{card.text}</p>
          </article>
        ))}
      </section>

      <section id="gallery" className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-5xl text-paper">Gym Gallery</h2>
          <p className="max-w-md text-sm text-muted">Admin can update these photos anytime from the dashboard.</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((image) => (
            <figure key={image.id} className="overflow-hidden rounded-2xl border border-line bg-panel/50">
              <img src={image.image_url} alt={image.alt_text || "Gym image"} className="h-64 w-full object-cover" />
              <figcaption className="px-4 py-3 text-xs text-muted">{image.alt_text || "Iron Temple atmosphere"}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="visit" className="mx-auto mt-16 grid max-w-7xl gap-5 px-4 md:grid-cols-[1.3fr_1fr] md:px-8">
        <article className="rounded-2xl border border-line bg-black/35 p-7 backdrop-blur">
          <h2 className="font-heading text-5xl text-paper">Membership Starts at $39/month</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
            Flexible plans, no hidden fees, and full access to all training zones. Ask front-desk for personal coaching
            packages and nutrition support.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-panel/70 p-4">
              <p className="font-heading text-3xl text-accent">24+</p>
              <p className="text-xs text-muted">Classes per week</p>
            </div>
            <div className="rounded-xl border border-line bg-panel/70 p-4">
              <p className="font-heading text-3xl text-accent">7</p>
              <p className="text-xs text-muted">Days open</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-line bg-panel/70 p-7">
          <h3 className="font-heading text-4xl text-paper">Opening Hours</h3>
          <ul className="mt-4 space-y-2">
            {classHours.map((item) => (
              <li key={item.day} className="flex items-center justify-between border-b border-line/70 pb-2 text-sm">
                <span className="text-muted">{item.day}</span>
                <span className="font-semibold text-paper">{item.time}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

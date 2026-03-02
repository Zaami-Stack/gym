/* eslint-disable @next/next/no-img-element */

import MainNav from "@/components/MainNav";
import { getPublicContent } from "@/lib/content";

const womenProgram = [
  {
    day: "Mardi",
    sessions: [
      { time: "14h30 - 15h15", className: "STEP" },
      { time: "15h30 - 16h15", className: "BODY COMBAT" },
      { time: "18h00 - 18h45", className: "YOGA" },
      { time: "19h00 - 19h45", className: "BODY ATTACK" },
    ],
  },
  {
    day: "Jeudi",
    sessions: [
      { time: "14h30 - 15h15", className: "GYM BATTON" },
      { time: "15h30 - 16h15", className: "CIRCUIT TRAINING" },
      { time: "18h00 - 18h45", className: "BODY ATTACK" },
      { time: "19h00 - 19h45", className: "BODY SCULPT (TAF-CAF)" },
    ],
  },
  {
    day: "Samedi",
    sessions: [
      { time: "09h00 - 09h45", className: "ZUMBA" },
      { time: "10h00 - 10h45", className: "DANCE ORIENTAL" },
      { time: "11h00 - 11h45", className: "PILATE" },
      { time: "12h00 - 12h45", className: "DANCE AFRICAINE" },
    ],
  },
];

const womenAvailability = [
  { day: "Mardi", hours: "14h30 - 20h30" },
  { day: "Jeudi", hours: "14h30 - 20h30" },
  { day: "Samedi", hours: "09h00 - 13h00" },
];

const menProgram = [
  { day: "Lundi", hours: "08:00 - 22:00", course: "" },
  { day: "Mardi", hours: "08:00 - 14:00", course: "C.P.G (20:30)" },
  { day: "Mercredi", hours: "08:00 - 22:00", course: "" },
  { day: "Jeudi", hours: "08:00 - 14:00", course: "" },
  { day: "Vendredi", hours: "08:00 - 22:00", course: "C.P.G (19:30)" },
  { day: "Samedi", hours: "14:00 - 18:00", course: "" },
  { day: "Dimanche", hours: "10:00 - 14:00", course: "" },
];

const womenProgramFlat = womenProgram.flatMap((item) =>
  item.sessions.map((session) => ({
    day: item.day,
    time: session.time,
    className: session.className,
  })),
);

const openingHours = [
  { day: "Lundi", hours: "08:00 - 22:00" },
  { day: "Mardi", hours: "08:00 - 14:00" },
  { day: "Mercredi", hours: "08:00 - 22:00" },
  { day: "Jeudi", hours: "08:00 - 14:00" },
  { day: "Vendredi", hours: "08:00 - 22:00" },
  { day: "Samedi", hours: "14:00 - 18:00" },
  { day: "Dimanche", hours: "10:00 - 14:00" },
];

const instagramUrl = "https://www.instagram.com/espace.fitness.sm/";
const phoneNumber = "0665661213";
const fullAddress = "NR 25, Lotissement Charaf, Casablanca, Casablanca, Morocco";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { settings, gallery, notifications, isAdmin, hasSession } = await getPublicContent();

  return (
    <main className="min-h-screen pb-16">
      <MainNav isAdmin={isAdmin} hasSession={hasSession} instagramUrl={instagramUrl} />

      {notifications.length > 0 ? (
        <div className="border-y border-line bg-black/40 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 text-sm text-accent">
            <p className="font-heading text-2xl text-accent">Alerts</p>
            {notifications.map((notification) => (
              <span
                key={notification.id}
                className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs md:text-sm"
              >
                {notification.message}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <section className="px-4 pt-4 md:px-8">
        <div
          className="mx-auto min-h-[64vh] max-w-7xl overflow-hidden rounded-3xl border border-line/60"
          style={{
            backgroundImage: `linear-gradient(110deg, rgb(2 10 29 / 90%) 0%, rgb(2 10 29 / 66%) 38%, rgb(2 10 29 / 86%) 100%), url(${settings.hero_image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex h-full flex-col justify-end px-5 pb-8 pt-10 md:px-12 md:pb-12 md:pt-16">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl leading-none text-paper sm:text-5xl md:text-7xl">{settings.hero_title}</h1>
              <p className="mt-4 max-w-2xl text-sm text-muted md:mt-5 md:text-lg">{settings.hero_subtitle}</p>
              <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
                <a
                  href="#programs"
                  className="rounded-full bg-accent-2 px-6 py-3 font-semibold text-paper transition hover:bg-accent-2/85"
                >
                  Voir Programmes
                </a>
                <a
                  href="#visit"
                  className="rounded-full border border-accent-2/70 bg-accent-2/10 px-6 py-3 font-semibold text-paper transition hover:bg-accent-2/20"
                >
                  Voir Tarifs
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <h2 className="font-heading text-4xl text-paper md:text-5xl">Programmes</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-line bg-panel/70 p-6 backdrop-blur">
            <h3 className="font-heading text-3xl text-accent md:text-4xl">Programme Femmes</h3>
            <div className="mt-4 space-y-3 md:hidden">
              {womenProgram.map((entry) => (
                <div key={entry.day} className="rounded-xl border border-line bg-black/20 p-3">
                  <p className="font-heading text-2xl text-paper">{entry.day}</p>
                  <ul className="mt-2 space-y-1">
                    {entry.sessions.map((session) => (
                      <li key={`${entry.day}-${session.time}-${session.className}`} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted">{session.time}</span>
                        <span className="font-semibold text-accent-2">{session.className}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                    <th className="px-2 py-2">Jour</th>
                    <th className="px-2 py-2">Horaire</th>
                    <th className="px-2 py-2">Cours</th>
                  </tr>
                </thead>
                <tbody>
                  {womenProgramFlat.map((item, index) => (
                    <tr key={`${item.day}-${item.time}-${index}`} className="border-b border-line/60 last:border-b-0">
                      <td className="px-2 py-2 font-semibold text-paper">{item.day}</td>
                      <td className="px-2 py-2 text-muted">{item.time}</td>
                      <td className="px-2 py-2 font-semibold text-accent-2">{item.className}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-1 text-xs text-muted">
              {womenAvailability.map((item) => (
                <li key={item.day}>
                  {item.day}: {item.hours}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-line bg-panel/70 p-6 backdrop-blur">
            <h3 className="font-heading text-3xl text-accent md:text-4xl">Programme Hommes</h3>
            <div className="mt-4 space-y-2 md:hidden">
              {menProgram.map((item) => (
                <div key={item.day} className="rounded-xl border border-line bg-black/20 p-3">
                  <p className="text-sm font-semibold text-paper">{item.day}</p>
                  <p className="text-xs text-muted">{item.hours}</p>
                  {item.course ? <p className="mt-1 text-xs font-semibold text-accent-2">{item.course}</p> : null}
                </div>
              ))}
            </div>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                    <th className="px-2 py-2">Jour</th>
                    <th className="px-2 py-2">Horaires</th>
                    <th className="px-2 py-2">Cours</th>
                  </tr>
                </thead>
                <tbody>
                  {menProgram.map((item) => (
                    <tr key={item.day} className="border-b border-line/60 last:border-b-0">
                      <td className="px-2 py-2 font-semibold text-paper">{item.day}</td>
                      <td className="px-2 py-2 text-muted">{item.hours}</td>
                      <td className="px-2 py-2 font-semibold text-accent-2">{item.course || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <article className="mt-5 rounded-2xl border border-line bg-black/35 p-6 backdrop-blur">
          <h3 className="font-heading text-3xl text-paper md:text-4xl">Opening Hours</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 md:hidden">
            {openingHours.map((item) => (
              <div key={item.day} className="flex items-center justify-between rounded-xl border border-line/70 bg-panel/50 px-3 py-2">
                <span className="text-sm font-semibold text-paper">{item.day}</span>
                <span className="text-xs text-muted">{item.hours}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <th className="px-2 py-2">Day</th>
                  <th className="px-2 py-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {openingHours.map((item) => (
                  <tr key={item.day} className="border-b border-line/60 last:border-b-0">
                    <td className="px-2 py-2 font-semibold text-paper">{item.day}</td>
                    <td className="px-2 py-2 text-muted">{item.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section id="gallery" className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-4xl text-paper md:text-5xl">Gym Gallery</h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((image) => (
            <figure key={image.id} className="overflow-hidden rounded-2xl border border-line bg-panel/50">
              <img
                src={image.image_url}
                alt={image.alt_text || "Gym image"}
                className="h-64 w-full object-cover transition duration-300 hover:scale-105"
              />
              <figcaption className="px-4 py-3 text-xs text-muted">{image.alt_text || "ESPACE FITNESS SM atmosphere"}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="visit" className="mx-auto mt-16 grid max-w-7xl gap-5 px-4 md:px-8">
        <article className="rounded-2xl border border-line bg-black/35 p-7 backdrop-blur">
          <h2 className="font-heading text-4xl text-paper md:text-5xl">Membership Starts at 200Dh/month</h2>
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
              <p className="font-heading text-3xl text-accent-2">7</p>
              <p className="text-xs text-muted">Days open</p>
            </div>
          </div>
        </article>
      </section>

      <section id="contact" className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
        <article className="rounded-2xl border border-line bg-panel/70 p-7">
          <h2 className="font-heading text-4xl text-paper md:text-5xl">Contact</h2>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>Visit ESPACE FITNESS SM reception for membership and coaching info.</p>
            <p>
              Phone:{" "}
              <a href={`tel:${phoneNumber}`} className="font-semibold text-paper underline-offset-4 hover:underline">
                {phoneNumber}
              </a>
            </p>
            <p>Address: {fullAddress}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-accent-2/70 bg-accent-2/20 px-5 py-2 text-sm font-semibold text-paper transition hover:bg-accent-2/30"
            >
              Instagram
            </a>
            <a
              href="#programs"
              className="rounded-full border border-paper/30 px-5 py-2 text-sm font-semibold text-paper transition hover:border-accent-2"
            >
              Programmes
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}

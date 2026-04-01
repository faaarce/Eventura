import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  MapPin,
  Users,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { BrowseLayout } from "@/components/events/BrowseLayout";
import { BrowseHeader } from "@/components/events/BrowseHeader";
import { mockEvents } from "@/data/mock-events";

export const Route = createFileRoute("/organizer/$organizeId")({
  component: OrganizerPage,
  loader: ({ params }) => {
    // Mock organizer data
    const organizer = {
      id: params.organizerId,
      name: "Devscale Indonesia",
      tagline: "Building the next generation of Indonesian developers",
      role: "Organizer",
      followers: 2400,
      totalEvents: 18,
      profileImage: null as string | null,
    };

    // Filter events "by" this organizer (mock: show a subset)
    const events = mockEvents.slice(0, 6);

    return { organizer, events };
  },
});

const categoryGradients: Record<string, string> = {
  conference: "from-[#328f97] to-[#1a5c62]",
  workshop: "from-[#2f6a4a] to-[#1a3d2b]",
  meetup: "from-[#6366f1] to-[#3b3da6]",
  concert: "from-[#e24b4a] to-[#8b2d2d]",
  sports: "from-[#ba7517] to-[#6e4510]",
  party: "from-[#d4537e] to-[#7e3149]",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

function OrganizerPage() {
  const { organizer, events } = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [following, setFollowing] = useState(false);

  const upcomingEvents = events.filter(
    (e) => new Date(e.date) >= new Date()
  );
  const pastEvents = events.filter(
    (e) => new Date(e.date) < new Date()
  );

  return (
    <BrowseLayout>
      <BrowseHeader search={search} onSearchChange={setSearch} />

      {/* Hero section */}
      <section className="relative overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#0a0a0a] to-[#111]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.04),transparent_60%)]" />

        <div className="page-wrap relative flex flex-col gap-6 pb-10 pt-10 sm:flex-row sm:items-end sm:gap-10 sm:pb-14 sm:pt-16 md:pb-16 md:pt-20">
          {/* Left: organizer info */}
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/40">
              {organizer.role}
            </p>
            <h1
              className="mt-2 text-4xl font-extrabold leading-none text-white sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {organizer.name}
            </h1>

            {organizer.tagline && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45 sm:mt-4 sm:text-base">
                {organizer.tagline}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
              <button
                onClick={() => setFollowing(!following)}
                className={`rounded-full border px-6 py-2.5 text-sm font-bold transition-all ${
                  following
                    ? "border-white/30 bg-white text-[#0a0a0a]"
                    : "border-white/40 bg-transparent text-white hover:bg-white/8"
                }`}
              >
                {following ? "FOLLOWING" : "FOLLOW"}
              </button>

              <div className="flex items-center gap-4 text-xs text-white/40 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  <span className="font-semibold text-white/60">
                    {organizer.followers.toLocaleString()}
                  </span>{" "}
                  followers
                </span>
                <span>
                  <span className="font-semibold text-white/60">
                    {organizer.totalEvents}
                  </span>{" "}
                  events
                </span>
              </div>
            </div>
          </div>

          {/* Right: profile image placeholder */}
          <div className="hidden shrink-0 sm:block">
            <div className="h-48 w-48 overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:h-56 md:w-56 lg:h-64 lg:w-64">
              {organizer.profileImage ? (
                <img
                  src={organizer.profileImage}
                  alt={organizer.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white/15 md:text-6xl">
                  {organizer.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* Content */}
      <main className="page-wrap py-8 sm:py-10">
        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <section className="rise-in">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              Upcoming events
            </h2>

            <div className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 sm:mt-6">
              {upcomingEvents.map((event) => {
                const gradient =
                  categoryGradients[event.category] ??
                  "from-[#328f97] to-[#1a5c62]";

                return (
                  <Link
                    key={event.id}
                    to="/events/$eventId"
                    params={{ eventId: event.id }}
                    className="group flex items-center gap-4 bg-white/[0.02] p-4 no-underline transition-colors hover:bg-white/[0.06] sm:p-5"
                  >
                    {/* Event thumbnail */}
                    <div
                      className={`h-14 w-14 shrink-0 rounded-xl bg-linear-to-br ${gradient} sm:h-16 sm:w-16`}
                    />

                    {/* Event info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white sm:text-base">
                        {event.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50 sm:text-sm">
                        <CalendarDays size={13} className="shrink-0" />
                        {formatDate(event.date)}
                      </p>
                    </div>

                    {/* Venue + price (right side) */}
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-semibold text-white/70">
                        {event.venue}
                      </p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {event.city}
                      </p>
                    </div>

                    <div className="hidden shrink-0 sm:block">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          event.price === 0
                            ? "bg-white/10 text-white"
                            : "bg-white/8 text-white/70"
                        }`}
                      >
                        {formatPrice(event.price, event.currency)}
                      </span>
                    </div>

                    <ChevronRight
                      size={18}
                      className="shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Past events */}
        {pastEvents.length > 0 && (
          <section className="rise-in mt-10" style={{ animationDelay: "80ms" }}>
            <h2 className="text-lg font-bold text-white/60 sm:text-xl">
              Past events
            </h2>

            <div className="mt-4 divide-y divide-white/6 overflow-hidden rounded-2xl border border-white/6 sm:mt-6">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  to="/events/$eventId"
                  params={{ eventId: event.id }}
                  className="group flex items-center gap-4 bg-white/[0.01] p-4 no-underline opacity-60 transition-all hover:bg-white/[0.04] hover:opacity-80 sm:p-5"
                >
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-white/6 sm:h-16 sm:w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white sm:text-base">
                      {event.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50 sm:text-sm">
                      <CalendarDays size={13} className="shrink-0" />
                      {formatDate(event.date)}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-sm text-white/50">{event.venue}</p>
                    <p className="mt-0.5 text-xs text-white/30">{event.city}</p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-white/15" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Share / external link */}
        <div
          className="rise-in mt-10 flex justify-center"
          style={{ animationDelay: "120ms" }}
        >
          <button className="flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-5 py-2.5 text-sm font-semibold text-white/50 transition-all hover:bg-white/8 hover:text-white">
            <ExternalLink size={15} />
            Bagikan profil
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-6 border-t border-white/8 sm:mt-10">
        <div className="page-wrap flex flex-col items-center gap-4 py-6 text-sm text-white/30 sm:flex-row sm:justify-between sm:py-8">
          <p>© 2026 Eventura</p>
          <div className="flex gap-6">
            <a href="#" className="text-white/30 no-underline hover:text-white/50">
              Privacy
            </a>
            <a href="#" className="text-white/30 no-underline hover:text-white/50">
              Terms
            </a>
            <a href="#" className="text-white/30 no-underline hover:text-white/50">
              Get help
            </a>
          </div>
        </div>
      </footer>
    </BrowseLayout>
  );
}
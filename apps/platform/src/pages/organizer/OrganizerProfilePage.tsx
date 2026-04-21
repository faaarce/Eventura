import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays, ChevronRight, Star, ExternalLink,
} from "lucide-react";
import { BrowseLayout } from "@/components/events/BrowseLayout";
import { BrowseHeader } from "@/components/events/BrowseHeader";
import { fetchOrganizerProfile, fetchEvents, type ApiEvent } from "@/utils/api";
import { queryKeys } from "@/utils/queryKeys";

const categoryGradients: Record<string, string> = {
  conference: "from-[#328f97] to-[#1a5c62]",
  workshop: "from-[#2f6a4a] to-[#1a3d2b]",
  meetup: "from-[#6366f1] to-[#3b3da6]",
  concert: "from-[#e24b4a] to-[#8b2d2d]",
  sports: "from-[#ba7517] to-[#6e4510]",
  party: "from-[#d4537e] to-[#7e3149]",
};

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function formatPrice(p: number): string {
  if (p === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(p);
}

export default function OrganizerProfilePage() {
  const { organizerId } = useParams<{ organizerId: string }>();
  const [search, setSearch] = useState("");

  const { data: organizer, isLoading: organizerLoading, error } = useQuery({
    queryKey: queryKeys.organizer.profile(organizerId!),
    queryFn: () => fetchOrganizerProfile(organizerId!),
    enabled: !!organizerId,
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: queryKeys.events.list({ organizerId, limit: 50 }),
    queryFn: () => fetchEvents({ organizerId, limit: 50 }),
    enabled: !!organizerId,
  });

  const events = eventsData?.events ?? [];

  if (organizerLoading || eventsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Organizer tidak ditemukan</p>
          <p className="mt-2 text-sm text-white/40">{String(error ?? "Not found")}</p>
          <Link to="/events" className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0a0a0a] no-underline">
            Kembali ke events
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.endDate) >= now);
  const pastEvents = events.filter((e) => new Date(e.endDate) < now);

  return (
    <BrowseLayout>
      <BrowseHeader search={search} onSearchChange={setSearch} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#0a0a0a] to-[#111]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.04),transparent_60%)]" />

        <div className="page-wrap relative flex flex-col gap-6 pb-10 pt-10 sm:flex-row sm:items-end sm:gap-10 sm:pb-14 sm:pt-16 md:pb-16 md:pt-20">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/40">Organizer</p>
            <h1
              className="mt-2 text-4xl font-extrabold leading-none text-white sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {organizer.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/50 sm:mt-6">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                <span className="font-semibold text-white/70">{organizer.totalEvents}</span>{" "}events
              </span>
              {organizer.totalReviews > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-white/70">{organizer.averageRating.toFixed(1)}</span>
                  <span>({organizer.totalReviews} reviews)</span>
                </span>
              )}
              <span className="text-xs text-white/30">
                Bergabung sejak{" "}
                {new Date(organizer.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          <div className="hidden shrink-0 sm:block">
            <div className="h-48 w-48 overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:h-56 md:w-56 lg:h-64 lg:w-64">
              {organizer.profileImage ? (
                <img src={organizer.profileImage} alt={organizer.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white/15 md:text-6xl">
                  {organizer.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      <main className="page-wrap py-8 sm:py-10">
        {upcomingEvents.length > 0 && (
          <section className="rise-in">
            <h2 className="text-lg font-bold text-white sm:text-xl">Upcoming events</h2>
            <div className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 sm:mt-6">
              {upcomingEvents.map((event) => <EventRow key={event.id} event={event} />)}
            </div>
          </section>
        )}

        {pastEvents.length > 0 && (
          <section className="rise-in mt-10" style={{ animationDelay: "80ms" }}>
            <h2 className="text-lg font-bold text-white/60 sm:text-xl">Past events</h2>
            <div className="mt-4 divide-y divide-white/6 overflow-hidden rounded-2xl border border-white/6 sm:mt-6">
              {pastEvents.map((event) => <EventRow key={event.id} event={event} dimmed />)}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 py-14 text-center">
            <p className="text-base font-semibold text-white">Belum ada event</p>
            <p className="mt-1 text-sm text-white/40">Organizer ini belum membuat event</p>
          </div>
        )}

        {organizer.recentReviews.length > 0 && (
          <section className="rise-in mt-10" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white sm:text-xl">Reviews</h2>
              <div className="flex items-center gap-2">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold text-white">{organizer.averageRating.toFixed(1)}</span>
                <span className="text-xs text-white/40">({organizer.totalReviews} reviews)</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {organizer.recentReviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-white/8 bg-white/4 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-white">{review.user.name}</p>
                          <p className="text-xs text-white/30">{review.event.name}</p>
                        </div>
                        <p className="text-xs text-white/30">
                          {new Date(review.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/15"}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-white/70">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="rise-in mt-10 flex justify-center" style={{ animationDelay: "160ms" }}>
          <button className="flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-5 py-2.5 text-sm font-semibold text-white/50 transition-all hover:bg-white/8 hover:text-white">
            <ExternalLink size={15} />
            Bagikan profil
          </button>
        </div>
      </main>

      <footer className="mt-6 border-t border-white/8 sm:mt-10">
        <div className="page-wrap flex flex-col items-center gap-4 py-6 text-sm text-white/30 sm:flex-row sm:justify-between sm:py-8">
          <p>© 2026 Eventura</p>
          <div className="flex gap-6">
            <a href="#" className="text-white/30 no-underline hover:text-white/50">Privacy</a>
            <a href="#" className="text-white/30 no-underline hover:text-white/50">Terms</a>
            <a href="#" className="text-white/30 no-underline hover:text-white/50">Get help</a>
          </div>
        </div>
      </footer>
    </BrowseLayout>
  );
}

function EventRow({ event, dimmed = false }: { event: ApiEvent; dimmed?: boolean }) {
  const gradient = categoryGradients[event.category.toLowerCase()] ?? "from-[#328f97] to-[#1a5c62]";
  const minPrice = event.isFree
    ? 0
    : event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : 0;

  return (
    <Link
      to={`/events/${event.slug}`}
      className={`group flex items-center gap-4 bg-white/[0.02] p-4 no-underline transition-colors hover:bg-white/[0.06] sm:p-5 ${
        dimmed ? "opacity-60 hover:opacity-80" : ""
      }`}
    >
      <div className={`h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-16 ${
        dimmed ? "bg-white/6" : `bg-linear-to-br ${gradient}`
      }`}>
        {event.imageUrl && (
          <img src={event.imageUrl} alt={event.name} className="h-full w-full rounded-xl object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white sm:text-base">{event.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50 sm:text-sm">
          <CalendarDays size={13} className="shrink-0" />
          {formatDate(event.startDate)}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className={`text-sm font-semibold ${dimmed ? "text-white/50" : "text-white/70"}`}>
          {event.venue}
        </p>
        <p className={`mt-0.5 text-xs ${dimmed ? "text-white/30" : "text-white/40"}`}>
          {event.location}
        </p>
      </div>

      <div className="hidden shrink-0 sm:block">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          minPrice === 0 ? "bg-white/10 text-white" : "bg-white/8 text-white/70"
        }`}>
          {formatPrice(minPrice)}
        </span>
      </div>

      <ChevronRight
        size={18}
        className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
          dimmed ? "text-white/15" : "text-white/20"
        }`}
      />
    </Link>
  );
}
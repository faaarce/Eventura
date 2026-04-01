import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Share2,
  Heart,
  Ticket,
  Info,
  ChevronRight,
} from "lucide-react";
import { BrowseLayout } from "@/components/events/BrowseLayout";
import { BrowseHeader } from "@/components/events/BrowseHeader";
import { mockEvents } from "@/data/mock-events";
import { useState } from "react";

export const Route = createFileRoute("/events/$eventId")({
  component: EventDetailPage,
  loader: ({ params }) => {
    const event = mockEvents.find((e) => e.id === params.eventId);
    if (!event) throw new Error("Event not found");
    return { event };
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

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: number, currency: string): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

function EventDetailPage() {
  const { event } = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState(false);

  const gradient =
    categoryGradients[event.category] ?? "from-[#328f97] to-[#1a5c62]";

  return (
    <BrowseLayout>
      <BrowseHeader search={search} onSearchChange={setSearch} />

      <main className="page-wrap py-6 sm:py-8">
        <Link
          to="/events"
          className="rise-in mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/50 no-underline transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to events
        </Link>

        <div className="flex flex-col gap-6 md:flex-row md:gap-8 lg:gap-10">
          <div className="w-full shrink-0 md:w-[45%] lg:w-[40%]">
            <div
              className={`rise-in aspect-square w-full rounded-2xl bg-linear-to-br ${gradient} relative overflow-hidden`}
            >
              <span
                className={`absolute left-4 top-4 rounded-full px-4 py-1.5 text-sm font-bold backdrop-blur-md ${
                  event.price === 0
                    ? "bg-white text-[#0a0a0a]"
                    : "bg-black/50 text-white"
                }`}
              >
                {formatPrice(event.price, event.currency)}
              </span>

              <span className="absolute bottom-4 left-4 rounded-full bg-black/45 px-4 py-1.5 text-sm font-semibold capitalize text-white backdrop-blur-md">
                {event.category}
              </span>
            </div>
          </div>

          <div
            className="rise-in flex flex-1 flex-col"
            style={{ animationDelay: "80ms" }}
          >
            <h1 className="display-title text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              {event.title}
            </h1>

            <div className="mt-5 flex flex-col gap-3 sm:mt-6">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <CalendarDays size={18} className="shrink-0 text-white/40" />
                <span>{formatFullDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Clock size={18} className="shrink-0 text-white/40" />
                <span>Doors open 18:00 · Starts 19:00</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <MapPin size={18} className="shrink-0 text-white/40" />
                <span>
                  {event.venue}, {event.city}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Users size={18} className="shrink-0 text-white/40" />
                <span>{event.attendees} going</span>
              </div>
            </div>

            <div className="mt-6 hidden flex-col gap-3 sm:mt-8 md:flex">
              <Link
                to="/events/$eventId/checkout"
                params={{ eventId: event.id }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-base font-bold text-[#0a0a0a] no-underline transition-all hover:bg-white/90"
              >
                <Ticket size={20} />
                Get Tickets — {formatPrice(event.price, event.currency)}
              </Link>
              <div className="flex gap-3">
                <button
                  onClick={() => setLiked(!liked)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    liked
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-white/12 bg-white/4 text-white/60 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Heart size={16} className={liked ? "fill-white" : ""} />
                  {liked ? "Saved" : "Save"}
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-3 text-sm font-semibold text-white/60 transition-all hover:bg-white/8 hover:text-white">
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>

            <div className="my-6 border-t border-white/8 sm:my-8" />

            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">
                About this event
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Join us for an unforgettable experience at {event.venue} in{" "}
                {event.city}. This {event.category} brings together enthusiasts
                and professionals from all over for a day of inspiration,
                connection, and great moments. Don't miss out — limited spots
                available.
              </p>
            </div>

            <div className="my-6 border-t border-white/8 sm:my-8" />

            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">
                Venue
              </h2>
              <button className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/4 p-4 text-left transition-all hover:bg-white/8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/8">
                    <MapPin size={18} className="text-white/50" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {event.venue}
                    </p>
                    <p className="mt-0.5 text-xs text-white/40">
                      {event.city}, Indonesia
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/30" />
              </button>
            </div>

            <div className="my-6 border-t border-white/8 sm:my-8" />

            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">
                Important info
              </h2>
              <div className="mt-3 flex flex-col gap-2.5">
                <div className="flex items-start gap-3 text-sm text-white/50">
                  <Info size={16} className="mt-0.5 shrink-0 text-white/30" />
                  <span>
                    You must be 17+ to attend this event. ID may be required.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm text-white/50">
                  <Info size={16} className="mt-0.5 shrink-0 text-white/30" />
                  <span>
                    Tickets are non-transferable. Name on ticket must match ID.
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm text-white/50">
                  <Info size={16} className="mt-0.5 shrink-0 text-white/30" />
                  <span>
                    No refunds unless the event is cancelled by the organizer.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[#0a0a0a]/95 p-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all ${
                liked
                  ? "border-white/30 bg-white/10"
                  : "border-white/12 bg-white/4"
              }`}
            >
              <Heart
                size={18}
                className={liked ? "fill-white text-white" : "text-white/60"}
              />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/12 bg-white/4">
              <Share2 size={18} className="text-white/60" />
            </button>
          </div>
          // Jadi ini:
          <Link
            to="/events/$eventId/checkout"
            params={{ eventId: event.id }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#0a0a0a] no-underline"
          >
            <Ticket size={18} />
            Get Tickets — {formatPrice(event.price, event.currency)}
          </Link>
        </div>
      </div>

      <div className="h-24 md:hidden" />

      <footer className="mt-10 border-t border-white/8 sm:mt-12">
        <div className="page-wrap flex flex-col items-center gap-4 py-6 text-sm text-white/30 sm:flex-row sm:justify-between sm:py-8">
          <p>© 2026 Eventura</p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-white/30 no-underline hover:text-white/50"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-white/30 no-underline hover:text-white/50"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-white/30 no-underline hover:text-white/50"
            >
              Get help
            </a>
          </div>
        </div>
      </footer>
    </BrowseLayout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, CalendarDays, MapPin, Ticket, Users, Eye, Tag } from "lucide-react";
import { fetchMyEvents, type ApiOrganizerEvent } from "@/utils/api";

export const Route = createFileRoute("/organizer/dashboard/events/")({
  component: MyEventsPage,
  ssr: false,
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

const categoryGradients: Record<string, string> = {
  conference: "from-[#328f97] to-[#1a5c62]",
  workshop: "from-[#2f6a4a] to-[#1a3d2b]",
  meetup: "from-[#6366f1] to-[#3b3da6]",
  concert: "from-[#e24b4a] to-[#8b2d2d]",
  sports: "from-[#ba7517] to-[#6e4510]",
  party: "from-[#d4537e] to-[#7e3149]",
};

function MyEventsPage() {
  const [events, setEvents] = useState<ApiOrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchMyEvents({ limit: 50 })
      .then((data) => {
        if (!cancelled) {
          setEvents(data.events);
          setError(null);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Gagal memuat events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display-title text-2xl font-bold text-white sm:text-3xl">
            Events Saya
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Kelola semua event yang kamu selenggarakan
          </p>
        </div>

        <Link
          to="/organizer/dashboard/events/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0a0a0a] no-underline transition-all hover:bg-white/90"
        >
          <Plus size={16} />
          Buat Event Baru
        </Link>
      </div>


      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-white/8 bg-white/4"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">{error}</p>
        </div>
      ) : events.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <OrganizerEventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/8">
            <CalendarDays size={28} className="text-white/40" />
          </div>
          <p className="mt-4 text-base font-semibold text-white">
            Belum ada event
          </p>
          <p className="mt-1 text-sm text-white/40">
            Mulai buat event pertamamu sekarang!
          </p>
          <Link
            to="/organizer/dashboard/events/new"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0a0a0a] no-underline"
          >
            <Plus size={15} />
            Buat Event Baru
          </Link>
        </div>
      )}
    </div>
  );
}

function OrganizerEventCard({ event }: { event: ApiOrganizerEvent }) {
  const gradient =
    categoryGradients[event.category.toLowerCase()] ??
    "from-[#328f97] to-[#1a5c62]";

  const totalAvailable = event.ticketTypes.reduce(
    (sum, t) => sum + t.availableSeats,
    0,
  );
  const totalSeats = event.ticketTypes.reduce(
    (sum, t) => sum + t.totalSeats,
    0,
  );
  const sold = totalSeats - totalAvailable;
  const percentage = totalSeats > 0 ? (sold / totalSeats) * 100 : 0;

  const minPrice = event.isFree
    ? 0
    : event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : 0;

  const isUpcoming = new Date(event.startDate) >= new Date();

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/4 transition-all hover:border-white/18 hover:bg-white/6">
      <div className={`relative aspect-[16/9] bg-linear-to-br ${gradient}`}>
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md ${
            isUpcoming
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-white/10 text-white/60"
          }`}
        >
          {isUpcoming ? "Aktif" : "Selesai"}
        </span>
        <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold capitalize text-white backdrop-blur-md">
          {event.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-bold leading-snug text-white sm:text-base">
          {event.name}
        </h3>

        <div className="mt-3 space-y-1.5 text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={12} />
            {formatDate(event.startDate)}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={12} />
            <span className="truncate">
              {event.venue}, {event.location}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ticket size={12} />
            Mulai {formatPrice(minPrice)}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {sold} / {totalSeats} terjual
            </span>
            <span className="font-semibold">{Math.round(percentage)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full bg-emerald-400 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/events/$eventId"
            params={{ eventId: event.id }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/4 px-3 py-2 text-xs font-semibold text-white/70 no-underline transition-all hover:bg-white/8 hover:text-white"
          >
            <Eye size={13} />
            Lihat
          </Link>
          <Link
            to="/organizer/dashboard/events/$eventId/vouchers"
            params={{ eventId: event.id }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/4 px-3 py-2 text-xs font-semibold text-white/70 no-underline transition-all hover:bg-white/8 hover:text-white"
          >
            <Tag size={13} />
            Voucher
          </Link>
        </div>
      </div>
    </div>
  );
}

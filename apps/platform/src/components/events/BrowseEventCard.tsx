import { MapPin, CalendarDays } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ApiEvent } from "@/utils/api";

interface BrowseEventCardProps {
  event: ApiEvent;
}

const categoryGradients: Record<string, string> = {
  conference: "from-[#328f97] to-[#1a5c62]",
  workshop: "from-[#2f6a4a] to-[#1a3d2b]",
  meetup: "from-[#6366f1] to-[#3b3da6]",
  concert: "from-[#e24b4a] to-[#8b2d2d]",
  sports: "from-[#ba7517] to-[#6e4510]",
  party: "from-[#d4537e] to-[#7e3149]",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
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

export function BrowseEventCard({ event }: BrowseEventCardProps) {
  const categoryKey = event.category.toLowerCase();
  const gradient =
    categoryGradients[categoryKey] ?? "from-[#328f97] to-[#1a5c62]";

  // Harga termurah dari ticketTypes
  const minPrice = event.isFree
    ? 0
    : event.ticketTypes.length > 0
      ? Math.min(...event.ticketTypes.map((t) => t.price))
      : 0;

  // Total seat tersedia
  const totalAvailable = event.ticketTypes.reduce(
    (sum, t) => sum + t.availableSeats,
    0,
  );

  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/8 bg-white/4 no-underline transition-all duration-200 hover:-translate-y-1 hover:border-white/18 hover:bg-white/8"
    >
      <div
        className={`relative aspect-square w-full bg-linear-to-br ${gradient}`}
      >
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-xs font-bold backdrop-blur-md sm:left-3 sm:top-3 sm:px-3 ${
            minPrice === 0
              ? "bg-white text-[#0a0a0a]"
              : "bg-black/50 text-white"
          }`}
        >
          {formatPrice(minPrice)}
        </span>

        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold capitalize text-white backdrop-blur-md sm:bottom-3 sm:left-3 sm:px-3">
          {event.category}
        </span>

        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white/80 backdrop-blur-md sm:bottom-3 sm:right-3 sm:px-3">
          {totalAvailable} seats
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50 sm:text-xs">
          <CalendarDays size={12} />
          {formatDate(event.startDate)}
        </div>

        <h3 className="mt-1.5 text-[13px] font-bold leading-snug text-white sm:text-sm">
          {event.name}
        </h3>

        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-white/40 sm:text-xs">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">
            {event.venue}, {event.location}
          </span>
        </div>
      </div>
    </Link>
  );
}

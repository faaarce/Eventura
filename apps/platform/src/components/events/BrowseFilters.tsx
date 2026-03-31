import { MapPin, CalendarDays, CircleDollarSign, X } from "lucide-react";

interface BrowseFiltersProps {
  activePrice: string | null;
  onPriceToggle: () => void;
}

export function BrowseFilters({
  activePrice,
  onPriceToggle,
}: BrowseFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
      <span className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-[#0a0a0a] sm:px-4 sm:py-2.5">
        <MapPin size={15} />
        City
      </span>

      <span className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-[#0a0a0a] sm:px-4 sm:py-2.5">
        <CalendarDays size={15} />
        Date
      </span>

      <button
        onClick={onPriceToggle}
        className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer sm:px-4 sm:py-2.5 ${
          activePrice
            ? "border-white bg-white text-[#0a0a0a]"
            : "border-white/25 bg-transparent text-white"
        }`}
      >
        <CircleDollarSign size={15} />
        {activePrice ?? "Price"}
        {activePrice && <X size={14} />}
      </button>
    </div>
  );
}

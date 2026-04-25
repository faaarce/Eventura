import { MapPin, CalendarDays, CircleDollarSign, X, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface BrowseFiltersProps {
  activePrice: string | null;
  onPriceToggle: () => void;
  activeCity: string | null;
  onCityChange: (city: string | null) => void;
  activeDate: string | null;
  onDateChange: (date: string | null) => void;
}

const CITIES = [
  "Palembang",
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Medan",
  "Bali",
];

const DATE_OPTIONS = [
  { key: "today", label: "Hari ini" },
  { key: "tomorrow", label: "Besok" },
  { key: "this-week", label: "Minggu ini" },
  { key: "this-month", label: "Bulan ini" },
];

export function BrowseFilters({
  activePrice,
  onPriceToggle,
  activeCity,
  onCityChange,
  activeDate,
  onDateChange,
}: BrowseFiltersProps) {
  const [openMenu, setOpenMenu] = useState<"city" | "date" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dateLabel = DATE_OPTIONS.find((d) => d.key === activeDate)?.label;

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center gap-2 sm:gap-2.5"
    >
      <div className="relative">
        <button
          onClick={() => setOpenMenu(openMenu === "city" ? null : "city")}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer sm:px-4 sm:py-2.5 ${
            activeCity
              ? "border-white bg-white text-[#0a0a0a]"
              : "border-white/25 bg-transparent text-white"
          }`}
        >
          <MapPin size={15} />
          {activeCity ?? "City"}
          {activeCity && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onCityChange(null);
                setOpenMenu(null);
              }}
              className="ml-0.5 inline-flex cursor-pointer"
            >
              <X size={14} />
            </span>
          )}
        </button>

        {openMenu === "city" && (
          <div className="absolute left-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
            {CITIES.map((city) => {
              const selected = activeCity === city;
              return (
                <button
                  key={city}
                  onClick={() => {
                    onCityChange(selected ? null : city);
                    setOpenMenu(null);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/8"
                >
                  {city}
                  {selected && <Check size={14} className="text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setOpenMenu(openMenu === "date" ? null : "date")}
          className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer sm:px-4 sm:py-2.5 ${
            activeDate
              ? "border-white bg-white text-[#0a0a0a]"
              : "border-white/25 bg-transparent text-white"
          }`}
        >
          <CalendarDays size={15} />
          {dateLabel ?? "Date"}
          {activeDate && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDateChange(null);
                setOpenMenu(null);
              }}
              className="ml-0.5 inline-flex cursor-pointer"
            >
              <X size={14} />
            </span>
          )}
        </button>

        {openMenu === "date" && (
          <div className="absolute left-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
            {DATE_OPTIONS.map((opt) => {
              const selected = activeDate === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    onDateChange(selected ? null : opt.key);
                    setOpenMenu(null);
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/8"
                >
                  {opt.label}
                  {selected && <Check size={14} className="text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

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

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrowseLayout } from "@/components/events/BrowseLayout";
import { BrowseHeader } from "@/components/events/BrowseHeader";
import { BrowseFilters } from "@/components/events/BrowseFilters";
import { BrowseCategories } from "@/components/events/BrowseCategories";
import { BrowsePromo } from "@/components/events/BrowsePromo";
import { BrowseEventCard } from "@/components/events/BrowseEventCard";
import { fetchEvents } from "@/utils/api";
import { queryKeys } from "@/utils/queryKeys";
import type { EventCategory } from "@/types/event";

export default function EventsListPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activePrice, setActivePrice] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(
    null,
  );
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = {
    search: debouncedSearch || undefined,
    category: activeCategory || undefined,
    isFree:
      activePrice === "Free"
        ? true
        : activePrice === "Paid"
          ? false
          : undefined,
    location: activeCity || undefined,
    dateFilter: activeDate || undefined,
    limit: 20,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: () => fetchEvents(filters),
  });

  const events = data?.events ?? [];

  return (
    <BrowseLayout>
      <BrowseHeader search={search} onSearchChange={setSearch} />

      <main className="page-wrap py-6 sm:py-8">
        <section className="rise-in relative z-30">
          <BrowseFilters
            activePrice={activePrice}
            onPriceToggle={() => {
              setActivePrice((p) => {
                if (!p) return "Free";
                if (p === "Free") return "Paid";
                return null;
              });
            }}
            activeCity={activeCity}
            onCityChange={setActiveCity}
            activeDate={activeDate}
            onDateChange={setActiveDate}
          />
        </section>

        <section
          className="rise-in mt-5 sm:mt-6"
          style={{ animationDelay: "60ms" }}
        >
          <BrowseCategories
            active={activeCategory}
            onSelect={setActiveCategory}
          />
        </section>

        <section
          className="rise-in mt-6 sm:mt-8"
          style={{ animationDelay: "120ms" }}
        >
          <BrowsePromo />
        </section>

        <section className="mt-8 sm:mt-10">
          <h2 className="display-title text-xl font-bold text-white sm:text-2xl md:text-3xl">
            Popular Events
          </h2>

          {isLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-xl border border-white/8 bg-white/4"
                />
              ))}
            </div>
          ) : error ? (
            <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/5 py-14 text-center">
              <p className="text-lg font-semibold text-red-400">
                Gagal memuat events
              </p>
              <p className="mt-2 text-sm text-white/40">
                Pastikan backend jalan di http://localhost:8000
              </p>
            </div>
          ) : events.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {events.map((event, i) => (
                <div
                  key={event.id}
                  className="rise-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <BrowseEventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-white/8 bg-white/4 py-14 text-center sm:mt-12 sm:py-16">
              <p className="text-lg font-semibold text-white">
                No events found
              </p>
              <p className="mt-2 text-sm text-white/40">
                Try adjusting your filters or search query.
              </p>
            </div>
          )}
        </section>
      </main>

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

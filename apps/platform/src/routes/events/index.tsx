import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { BrowseLayout } from "@/components/events/BrowseLayout";
import { BrowseHeader } from "@/components/events/BrowseHeader";
import { BrowseFilters } from "@/components/events/BrowseFilters";
import { BrowseCategories } from "@/components/events/BrowseCategories";
import { BrowsePromo } from "@/components/events/BrowsePromo";
import { BrowseEventCard } from "@/components/events/BrowseEventCard";
import { mockEvents } from "@/data/mock-events";
import type { EventCategory } from "@/types/event";

export const Route = createFileRoute("/events/")({
  component: EventsPage,
});

function EventsPage() {
  const [search, setSearch] = useState("");
  const [activePrice, setActivePrice] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);

  const filteredEvents = useMemo(() => {
    return mockEvents.filter((event) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          event.title.toLowerCase().includes(q) ||
          event.venue.toLowerCase().includes(q) ||
          event.city.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (activeCategory && event.category !== activeCategory) return false;
      if (activePrice === "Free" && event.price !== 0) return false;
      if (activePrice === "Paid" && event.price === 0) return false;
      return true;
    });
  }, [search, activeCategory, activePrice]);

  return (
    <BrowseLayout>
      <BrowseHeader search={search} onSearchChange={setSearch} />

      <main className="page-wrap py-6 sm:py-8">
        <section className="rise-in">
          <BrowseFilters
            activePrice={activePrice}
            onPriceToggle={() => {
              setActivePrice((p) => {
                if (!p) return "Free";
                if (p === "Free") return "Paid";
                return null;
              });
            }}
          />
        </section>

        <section className="rise-in mt-5 sm:mt-6" style={{ animationDelay: "60ms" }}>
          <BrowseCategories active={activeCategory} onSelect={setActiveCategory} />
        </section>

        <section className="rise-in mt-6 sm:mt-8" style={{ animationDelay: "120ms" }}>
          <BrowsePromo />
        </section>

        <section className="mt-8 sm:mt-10">
          <h2 className="display-title text-xl font-bold text-white sm:text-2xl md:text-3xl">
            Popular Events
          </h2>

          {filteredEvents.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredEvents.map((event, i) => (
                <div key={event.id} className="rise-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <BrowseEventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-white/8 bg-white/4 py-14 text-center sm:mt-12 sm:py-16">
              <p className="text-lg font-semibold text-white">No events found</p>
              <p className="mt-2 text-sm text-white/40">Try adjusting your filters or search query.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-10 border-t border-white/8 sm:mt-12">
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
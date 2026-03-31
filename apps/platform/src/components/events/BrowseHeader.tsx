import { Search, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

interface BrowseHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function BrowseHeader({ search, onSearchChange }: BrowseHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0a0a]/92 backdrop-blur-xl">
      <div className="page-wrap flex items-center gap-4 py-3 md:gap-6">
        <a href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <Sparkles size={17} className="text-[#0a0a0a]" strokeWidth={2.5} />
          </span>
          <span className="display-title text-lg font-bold text-white">
            Eventura
          </span>
        </a>

        <div className="hidden flex-1 items-center gap-2.5 rounded-full border border-white/10 bg-white/8 px-4 py-2.5 md:flex md:max-w-sm lg:max-w-md">
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            type="text"
            placeholder="Search by event, venue or city"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold md:flex">
          <a href="/events" className="text-white no-underline">
            Browse events
          </a>
          <a href="#" className="text-white/55 no-underline">
            Get help
          </a>
          <a href="#" className="text-white/55 no-underline">
            Log in / Sign up
          </a>
          <button className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0a0a0a]">
            GET THE APP
          </button>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="ml-auto text-white md:hidden"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="border-t border-white/8 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/8 px-4 py-2.5">
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            type="text"
            placeholder="Search by event, venue or city"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/8 px-4 py-4 md:hidden">
          <a
            href="/events"
            className="rounded-lg px-4 py-3 text-sm font-semibold text-white no-underline"
          >
            Browse events
          </a>
          <a
            href="#"
            className="rounded-lg px-4 py-3 text-sm font-semibold text-white/55 no-underline"
          >
            Get help
          </a>
          <a
            href="#"
            className="rounded-lg px-4 py-3 text-sm font-semibold text-white/55 no-underline"
          >
            Log in / Sign up
          </a>
          <button className="mt-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0a0a0a]">
            GET THE APP
          </button>
        </nav>
      )}
    </header>
  );
}


import { Search, Sparkles, Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { HEADERS } from "@tanstack/react-start/server";

interface BrowseHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function BrowseHeader({ search, onSearchChange }: BrowseHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0a0a]/92 backdrop-blur-xl">
      <div className="page-wrap flex items-center gap-4 py-3 md:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <Sparkles size={17} className="text-[#0a0a0a]" strokeWidth={2.5} />
          </span>
          <span className="display-title text-lg font-bold text-white">
            Eventura
          </span>
        </Link>

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
          <Link to="/events" className="text-white no-underline">
            Browse events
          </Link>
          <a href="#" className="text-white/55 no-underline">
            Get help
          </a>
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white no-underline transition-colors hover:bg-white/15"
            >
              <User size={15} />
              Profile
            </Link>
          ) : (
            <Link to="/auth/login" className="text-white/55 no-underline">
              Log in / Sign up
            </Link>
          )}
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
          <Link
            to="/events"
            className="rounded-lg px-4 py-3 text-sm font-semibold text-white no-underline"
          >
            Browse events
          </Link>
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="rounded-lg px-4 py-3 text-sm font-semibold text-white no-underline"
            >
              Profile
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-lg px-4 py-3 text-sm font-semibold text-white/55 no-underline"
            >
              Log in / Sign up
            </Link>
          )}
          
            href="#"
            className="rounded-lg px-4 py-3 text-sm font-semibold text-white/55 no-underline"
          >
            Get help
          </a>
        </nav>
      )}
    </header>
  );
}
import { useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  Sparkles,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom } from "@/stores/auth";
import { logout } from "@/utils/auth";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = useAtomValue(userAtom);
  const setUser = useSetAtom(userAtom);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    if (!confirm("Yakin mau logout?")) return;
    await logout();
    queryClient.clear();
    setUser(null);
    navigate("/auth/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/events" className="flex items-center gap-2 no-underline">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                <Sparkles
                  size={17}
                  className="text-[#0a0a0a]"
                  strokeWidth={2.5}
                />
              </span>
              <span className="display-title text-lg font-bold text-white">
                Eventura
              </span>
            </Link>
            <span className="hidden rounded-full bg-white/8 px-2.5 py-0.5 text-xs font-semibold text-white/60 sm:inline">
              Organizer
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/events"
              className="hidden items-center gap-2 text-xs font-semibold text-white/50 no-underline transition-colors hover:text-white sm:flex"
            >
              <ArrowLeft size={14} />
              Ke site
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-sm font-bold text-white">
                {user?.email.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="text-sm font-semibold text-white/70">
                {user?.email || "Organizer"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-white/12 bg-white/4 px-3 py-1.5 text-xs font-semibold text-white/60 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-60 shrink-0 border-r border-white/8 bg-white/[0.02] p-4 md:block">
          <nav className="flex flex-col gap-1">
            <SidebarLink
              to="/organizer/dashboard"
              icon={LayoutDashboard}
              label="Statistik"
              end
            />
            <SidebarLink
              to="/organizer/dashboard/events"
              icon={CalendarDays}
              label="Events"
            />
            <SidebarLink
              to="/organizer/dashboard/transactions"
              icon={Receipt}
              label="Transaksi"
            />
          </nav>
        </aside>

        <div className="sticky top-[57px] z-30 w-full border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-xl md:hidden">
          <nav className="-mx-px flex overflow-x-auto">
            <MobileTab
              to="/organizer/dashboard"
              icon={LayoutDashboard}
              label="Stats"
              end
            />
            <MobileTab
              to="/organizer/dashboard/events"
              icon={CalendarDays}
              label="Events"
            />
            <MobileTab
              to="/organizer/dashboard/transactions"
              icon={Receipt}
              label="Transaksi"
            />
          </nav>
        </div>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  end = false,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition-all ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/60 hover:bg-white/6 hover:text-white"
        }`
      }
    >
      <Icon size={17} />
      {label}
    </NavLink>
  );
}

function MobileTab({
  to,
  icon: Icon,
  label,
  end = false,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex shrink-0 items-center justify-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold no-underline transition-all ${
          isActive
            ? "border-white text-white"
            : "border-transparent text-white/50"
        }`
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  );
}

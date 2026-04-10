import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Users,
  Mail,
  Ticket,
  Download,
  Search,
} from "lucide-react";
import { useState, useMemo } from "react";
import { fetchEventAttendees } from "@/utils/api";

export const Route = createFileRoute(
  "/organizer/dashboard/events/$eventId/attendees"
)({
  component: AttendeesPage,
  ssr: false,
  loader: async ({ params }) => {
    const data = await fetchEventAttendees(params.eventId, { limit: 100 });
    return data;
  },
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="text-sm font-semibold text-red-400">{String(error)}</p>
        <Link
          to="/organizer/dashboard/events"
          className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0a0a0a] no-underline"
        >
          Kembali ke Events
        </Link>
      </div>
    </div>
  ),
});

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AttendeesPage() {
  const { eventName, attendees, pagination } = Route.useLoaderData();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return attendees;
    const q = search.toLowerCase();
    return attendees.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.invoiceNumber.toLowerCase().includes(q)
    );
  }, [attendees, search]);

  const totalTickets = attendees.reduce((sum, a) => sum + a.totalQuantity, 0);
  const totalRevenue = attendees.reduce((sum, a) => sum + a.totalPaid, 0);

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Invoice",
      "Tickets",
      "Quantity",
      "Total Paid",
      "Purchased At",
    ];
    const rows = attendees.map((a) => [
      a.name,
      a.email,
      a.invoiceNumber,
      a.tickets.map((t) => `${t.quantity}x ${t.type}`).join("; "),
      a.totalQuantity,
      a.totalPaid,
      formatDate(a.purchasedAt),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `attendees-${eventName.replace(/\s+/g, "-").toLowerCase()}.csv`
    );
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/organizer/dashboard/events"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/50 no-underline transition-colors hover:text-white"
      >
        <ArrowLeft size={16} />
        Kembali ke Events
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Attendees untuk
          </p>
          <h1 className="display-title mt-1 text-2xl font-bold text-white sm:text-3xl">
            {eventName}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Daftar customer yang udah beli tiket
          </p>
        </div>

        {attendees.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10"
          >
            <Download size={15} />
            Export CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Attendees"
          value={pagination.total.toLocaleString("id-ID")}
          color="indigo"
        />
        <StatCard
          label="Total Tiket"
          value={totalTickets.toLocaleString("id-ID")}
          color="teal"
        />
        <StatCard
          label="Total Revenue"
          value={formatPrice(totalRevenue)}
          color="emerald"
        />
      </div>

      {/* Search */}
      {attendees.length > 0 && (
        <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 sm:max-w-md">
          <Search size={16} className="shrink-0 text-white/30" />
          <input
            type="text"
            placeholder="Cari nama, email, atau invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>
      )}

      {/* List */}
      {filtered.length > 0 ? (
        <div className="mt-4 space-y-3">
          {filtered.map((attendee, i) => (
            <AttendeeRow key={`${attendee.invoiceNumber}-${i}`} attendee={attendee} />
          ))}
        </div>
      ) : attendees.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 py-10 text-center">
          <p className="text-sm font-semibold text-white/60">
            Tidak ada hasil untuk "{search}"
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/8">
            <Users size={28} className="text-white/40" />
          </div>
          <p className="mt-4 text-base font-semibold text-white">
            Belum ada attendees
          </p>
          <p className="mt-1 text-sm text-white/40">
            Customer yang beli tiket dan udah di-accept akan muncul di sini
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "indigo" | "teal" | "emerald";
}) {
  const gradients = {
    indigo: "from-[#6366f1]/20",
    teal: "from-[#328f97]/20",
    emerald: "from-[#2f6a4a]/20",
  };
  const textColors = {
    indigo: "text-indigo-400",
    teal: "text-[#60d7cf]",
    emerald: "text-emerald-400",
  };

  return (
    <div
      className={`rounded-2xl border border-white/8 bg-gradient-to-br ${gradients[color]} to-transparent p-5`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wider ${textColors[color]}`}>
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function AttendeeRow({ attendee }: { attendee: ReturnType<typeof Object> }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            {attendee.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white sm:text-base">
              {attendee.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
              <Mail size={11} />
              <span className="truncate">{attendee.email}</span>
            </p>
            <p className="mt-0.5 font-mono text-xs text-white/30">
              {attendee.invoiceNumber}
            </p>

            {/* Tickets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {attendee.tickets.map((ticket: any, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-0.5 text-xs text-white/70"
                >
                  <Ticket size={10} />
                  {ticket.quantity}× {ticket.type}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <p className="text-xs text-white/40">Total dibayar</p>
          <p className="text-lg font-bold text-white">
            {formatPrice(attendee.totalPaid)}
          </p>
          <p className="text-xs text-white/30">
            {formatDate(attendee.purchasedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
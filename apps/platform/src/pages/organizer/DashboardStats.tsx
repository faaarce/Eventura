import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  Ticket,
  CalendarDays,
  Receipt,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchDashboardStats } from "@/utils/api";
import { queryKeys } from "@/utils/queryKeys";

function formatPrice(p: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(p);
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const STATUS_LABELS: Record<string, string> = {
  WAITING_FOR_PAYMENT: "Menunggu Bayar",
  WAITING_FOR_CONFIRMATION: "Menunggu Konfirmasi",
  DONE: "Berhasil",
  REJECTED: "Ditolak",
  EXPIRED: "Expired",
  CANCELED: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  WAITING_FOR_PAYMENT: "text-yellow-400 bg-yellow-500/10",
  WAITING_FOR_CONFIRMATION: "text-blue-400 bg-blue-500/10",
  DONE: "text-emerald-400 bg-emerald-500/10",
  REJECTED: "text-red-400 bg-red-500/10",
  EXPIRED: "text-white/40 bg-white/5",
  CANCELED: "text-white/40 bg-white/5",
};

export default function DashboardStats() {
  const currentYear = new Date().getFullYear();

  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterMonth, setFilterMonth] = useState<number | "all">("all");

  const filters: { year?: number; month?: number } = {};
  if (filterYear !== "all") filters.year = filterYear;
  if (filterMonth !== "all" && filterYear !== "all")
    filters.month = filterMonth;

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.dashboard.stats(filters),
    queryFn: () => fetchDashboardStats(filters),
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display-title text-2xl font-bold text-white sm:text-3xl">
            Statistik
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Ringkasan pendapatan dan performa event kamu
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={filterYear}
            onChange={(e) => {
              const val = e.target.value;
              setFilterYear(val === "all" ? "all" : parseInt(val));
              if (val === "all") setFilterMonth("all");
            }}
            className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-white/30"
          >
            <option value="all">Semua tahun</option>
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={filterMonth}
            onChange={(e) => {
              const val = e.target.value;
              setFilterMonth(val === "all" ? "all" : parseInt(val));
            }}
            disabled={filterYear === "all"}
            className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-white/30 disabled:opacity-40"
          >
            <option value="all">Semua bulan</option>
            {MONTHS.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-white/8 bg-white/4"
            />
          ))}
        </div>
      ) : error || !stats ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">
            Gagal memuat statistik
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={DollarSign}
              label="Revenue"
              value={formatPrice(stats.totalRevenue)}
              color="emerald"
            />
            <StatCard
              icon={Ticket}
              label="Tiket Terjual"
              value={stats.totalTicketsSold.toLocaleString("id-ID")}
              color="teal"
            />
            <StatCard
              icon={Receipt}
              label="Transaksi Sukses"
              value={stats.totalTransactions.toLocaleString("id-ID")}
              color="indigo"
            />
            <StatCard
              icon={CalendarDays}
              label="Total Events"
              value={stats.totalEvents.toLocaleString("id-ID")}
              color="pink"
            />
          </div>

          <section className="mt-8 rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <h2 className="text-base font-bold text-white sm:text-lg">
                Revenue per Event
              </h2>
            </div>

            {stats.revenueByEvent.length > 0 ? (
              <div className="mt-5 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.revenueByEvent.map((e) => ({
                      name:
                        e.eventName.length > 20
                          ? e.eventName.slice(0, 20) + "…"
                          : e.eventName,
                      revenue: e.revenue,
                      transactions: e.transactions,
                    }))}
                    margin={{ top: 10, right: 10, left: 10, bottom: 50 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.08)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      tickFormatter={(val) => {
                        if (val >= 1_000_000) return `${val / 1_000_000}jt`;
                        if (val >= 1_000) return `${val / 1_000}rb`;
                        return String(val);
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                      formatter={(value, name) => {
                        const num = Number(value);
                        if (name === "revenue")
                          return [formatPrice(num), "Revenue"];
                        return [num, "Transaksi"];
                      }}
                      labelStyle={{ color: "#fff", fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#60d7cf"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-4 py-10 text-center">
                <p className="text-sm text-white/40">
                  Belum ada data revenue untuk periode ini
                </p>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
            <h2 className="text-base font-bold text-white sm:text-lg">
              Transaksi berdasarkan Status
            </h2>

            {stats.transactionsByStatus.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {stats.transactionsByStatus.map((item) => {
                  const colorClass =
                    STATUS_COLORS[item.status] || "text-white/50 bg-white/5";
                  return (
                    <div
                      key={item.status}
                      className={`rounded-xl ${colorClass.split(" ")[1]} p-4`}
                    >
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${colorClass.split(" ")[0]}`}
                      >
                        {STATUS_LABELS[item.status] || item.status}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {item.count}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/40">
                Belum ada transaksi untuk periode ini
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: "emerald" | "teal" | "indigo" | "pink";
}) {
  const colorMap = {
    emerald: "from-[#2f6a4a]/20 text-emerald-400",
    teal: "from-[#328f97]/20 text-[#60d7cf]",
    indigo: "from-[#6366f1]/20 text-indigo-400",
    pink: "from-[#d4537e]/20 text-pink-400",
  };
  const [bgGradient, textColor] = colorMap[color].split(" ");

  return (
    <div
      className={`rounded-2xl border border-white/8 bg-gradient-to-br ${bgGradient} to-transparent p-5`}
    >
      <div
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${textColor}`}
      >
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">{value}</p>
    </div>
  );
}

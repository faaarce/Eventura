import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Tag, CalendarDays, Users, Copy, Check, Sparkles,
} from "lucide-react";
import {
  fetchEventById, fetchEventVouchers, createVoucher, type ApiVoucher,
} from "@/utils/api";
import { queryKeys } from "@/utils/queryKeys";

function formatPrice(p: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(p);
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "PROMO";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function DashboardVouchers() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: queryKeys.events.byId(eventId!),
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: queryKeys.events.vouchers(eventId!),
    queryFn: () => fetchEventVouchers(eventId!),
    enabled: !!eventId,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountAmount: "",
    startDate: "",
    endDate: "",
    maxUsage: "",
  });
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createVoucher>[1]) => createVoucher(eventId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.vouchers(eventId!) });
      resetForm();
      setShowForm(false);
    },
    onError: async (err: any) => {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Gagal membuat voucher");
      } catch {
        setError("Gagal membuat voucher");
      }
    },
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const resetForm = () => {
    setForm({ code: "", discountAmount: "", startDate: "", endDate: "", maxUsage: "" });
    setError("");
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch { /* ignore */ }
  };

  const handleSubmit = () => {
    if (!form.code || form.code.length < 3) { setError("Kode voucher minimal 3 karakter"); return; }
    if (!form.discountAmount || parseInt(form.discountAmount) < 1) { setError("Jumlah diskon minimal Rp 1"); return; }
    if (!form.startDate || !form.endDate) { setError("Tanggal mulai dan selesai wajib diisi"); return; }
    if (new Date(form.startDate) >= new Date(form.endDate)) { setError("Tanggal selesai harus setelah tanggal mulai"); return; }
    if (!form.maxUsage || parseInt(form.maxUsage) < 1) { setError("Max usage minimal 1"); return; }

    setError("");
    createMutation.mutate({
      code: form.code.toUpperCase(),
      discountAmount: parseInt(form.discountAmount),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      maxUsage: parseInt(form.maxUsage),
    });
  };

  if (eventLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">{String(eventError ?? "Event tidak ditemukan")}</p>
          <Link to="/organizer/dashboard/events" className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0a0a0a] no-underline">
            Kembali ke Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/organizer/dashboard/events" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/50 no-underline transition-colors hover:text-white">
        <ArrowLeft size={16} />
        Kembali ke Events
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Voucher untuk</p>
          <h1 className="display-title mt-1 text-2xl font-bold text-white sm:text-3xl">{event.name}</h1>
          <p className="mt-1 text-sm text-white/50">Kelola voucher diskon untuk event ini</p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90"
          >
            <Plus size={16} />
            Buat Voucher
          </button>
        )}
      </div>

      {showForm && (
        <section className="mt-6 rounded-2xl border border-white/12 bg-white/5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Voucher Baru</h2>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-xs font-semibold text-white/50 hover:text-white"
            >
              Batal
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">Kode Voucher</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PROMO123"
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                  className="form-input flex-1 font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={() => updateField("code", generateRandomCode())}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                  <Sparkles size={13} />
                  Generate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">Jumlah Diskon (Rp)</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={form.discountAmount}
                  onChange={(e) => updateField("discountAmount", e.target.value)}
                  min={1}
                  className="form-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">Max Penggunaan</label>
                <input
                  type="number"
                  placeholder="100"
                  value={form.maxUsage}
                  onChange={(e) => updateField("maxUsage", e.target.value)}
                  min={1}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">Berlaku Dari</label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">Berlaku Sampai</label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {createMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
              ) : (
                <><Plus size={16} /> Buat Voucher</>
              )}
            </button>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">
          Voucher Existing ({vouchers.length})
        </h2>

        {vouchers.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {vouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                isCopied={copiedCode === voucher.code}
                onCopy={() => handleCopyCode(voucher.code)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/8">
              <Tag size={24} className="text-white/40" />
            </div>
            <p className="mt-3 text-sm font-semibold text-white">Belum ada voucher</p>
            <p className="mt-1 text-xs text-white/40">Buat voucher pertama buat event ini</p>
          </div>
        )}
      </section>
    </div>
  );
}

function VoucherCard({
  voucher, isCopied, onCopy,
}: { voucher: ApiVoucher; isCopied: boolean; onCopy: () => void }) {
  const now = new Date();
  const isActive = new Date(voucher.startDate) <= now && new Date(voucher.endDate) >= now;
  const isExpired = new Date(voucher.endDate) < now;
  const isUpcoming = new Date(voucher.startDate) > now;
  const isExhausted = voucher.usedCount >= voucher.maxUsage;

  const statusLabel = isExhausted ? "Habis"
    : isExpired ? "Expired"
      : isUpcoming ? "Belum Mulai"
        : isActive ? "Aktif" : "-";

  const statusColor = isExhausted ? "text-white/40 bg-white/8"
    : isExpired ? "text-red-400 bg-red-500/10"
      : isUpcoming ? "text-yellow-400 bg-yellow-500/10"
        : "text-emerald-400 bg-emerald-500/10";

  const usagePercent = (voucher.usedCount / voucher.maxUsage) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-gradient-to-br from-[#d4537e]/10 to-transparent p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pink-400">
          <Tag size={13} />
          Voucher
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold text-white">{formatPrice(voucher.discountAmount)}</p>
      <p className="text-xs text-white/40">Diskon per transaksi</p>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-lg bg-white/10 px-3 py-2">
          <code className="flex-1 font-mono text-sm font-bold tracking-wider text-white">{voucher.code}</code>
        </div>
        <button
          onClick={onCopy}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
            isCopied ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Users size={11} />
            {voucher.usedCount} / {voucher.maxUsage} dipakai
          </span>
          <span className="font-semibold">{Math.round(usagePercent)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div className="h-full bg-pink-400 transition-all" style={{ width: `${usagePercent}%` }} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-white/40">
        <CalendarDays size={11} />
        {formatDate(voucher.startDate)} — {formatDate(voucher.endDate)}
      </div>
    </div>
  );
}
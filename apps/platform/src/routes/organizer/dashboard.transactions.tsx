import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  CalendarDays,
  Ticket,
  Eye,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import {
  fetchOrganizerTransactions,
  acceptTransaction,
  rejectTransaction,
  type ApiOrganizerTransaction,
  type TransactionStatus,
} from "@/utils/api";

export const Route = createFileRoute("/organizer/dashboard/transactions")({
  component: TransactionsPage,
  ssr: false
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

const statusConfig: Record<
  TransactionStatus,
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  WAITING_FOR_PAYMENT: {
    label: "Menunggu Bayar",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    icon: Clock,
  },
  WAITING_FOR_CONFIRMATION: {
    label: "Perlu Konfirmasi",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: Clock,
  },
  DONE: {
    label: "Diterima",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Ditolak",
    color: "text-red-400",
    bg: "bg-red-500/10",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    color: "text-white/40",
    bg: "bg-white/5",
    icon: AlertTriangle,
  },
  CANCELED: {
    label: "Dibatalkan",
    color: "text-white/40",
    bg: "bg-white/5",
    icon: XCircle,
  },
};

function TransactionsPage() {
  const [transactions, setTransactions] = useState<ApiOrganizerTransaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "ALL">(
    "WAITING_FOR_CONFIRMATION",
  );

  // Modal state
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await fetchOrganizerTransactions({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 50,
      });
      setTransactions(data.transactions);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleAccept = async (trxId: string) => {
    if (!confirm("Terima pembayaran transaksi ini? Tiket akan aktif.")) return;

    setProcessingId(trxId);
    try {
      await acceptTransaction(trxId);
      // Remove dari list kalau filter-nya WAITING_FOR_CONFIRMATION
      if (statusFilter === "WAITING_FOR_CONFIRMATION") {
        setTransactions((prev) => prev.filter((t) => t.id !== trxId));
      } else {
        // Refetch biar status update
        await loadTransactions();
      }
    } catch (err: any) {
      try {
        const body = await err.response?.json();
        alert(body?.message || "Gagal menerima transaksi");
      } catch {
        alert("Gagal menerima transaksi");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (trxId: string) => {
    if (
      !confirm(
        "Tolak transaksi ini? Tiket dan voucher akan dikembalikan ke customer.",
      )
    )
      return;

    setProcessingId(trxId);
    try {
      await rejectTransaction(trxId);
      if (statusFilter === "WAITING_FOR_CONFIRMATION") {
        setTransactions((prev) => prev.filter((t) => t.id !== trxId));
      } else {
        await loadTransactions();
      }
    } catch (err: any) {
      try {
        const body = await err.response?.json();
        alert(body?.message || "Gagal menolak transaksi");
      } catch {
        alert("Gagal menolak transaksi");
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Count untuk badge
  const needsActionCount = transactions.filter(
    (t) => t.status === "WAITING_FOR_CONFIRMATION",
  ).length;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="display-title text-2xl font-bold text-white sm:text-3xl">
          Transaksi
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Kelola semua transaksi dari event kamu
          {statusFilter === "WAITING_FOR_CONFIRMATION" &&
            needsActionCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">
                {needsActionCount} butuh konfirmasi
              </span>
            )}
        </p>
      </div>

      {/* Status filter */}
      <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {(
          [
            ["WAITING_FOR_CONFIRMATION", "Perlu Konfirmasi"],
            ["DONE", "Diterima"],
            ["WAITING_FOR_PAYMENT", "Menunggu Bayar"],
            ["REJECTED", "Ditolak"],
            ["EXPIRED", "Expired"],
            ["CANCELED", "Dibatalkan"],
            ["ALL", "Semua"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key as TransactionStatus | "ALL")}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
              statusFilter === key
                ? "border-white/30 bg-white text-[#0a0a0a]"
                : "border-white/12 bg-white/4 text-white/60 hover:bg-white/8"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-white/8 bg-white/4"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">{error}</p>
        </div>
      ) : transactions.length > 0 ? (
        <div className="mt-6 space-y-3">
          {transactions.map((trx) => (
            <TransactionRow
              key={trx.id}
              trx={trx}
              processing={processingId === trx.id}
              onAccept={() => handleAccept(trx.id)}
              onReject={() => handleReject(trx.id)}
              onViewProof={() =>
                trx.paymentProof && setProofPreview(trx.paymentProof)
              }
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/8">
            <Receipt size={28} className="text-white/40" />
          </div>
          <p className="mt-4 text-base font-semibold text-white">
            Belum ada transaksi
          </p>
          <p className="mt-1 text-sm text-white/40">
            Tidak ada transaksi dengan status ini
          </p>
        </div>
      )}

      {/* Payment proof modal */}
      {proofPreview && (
        <ProofModal url={proofPreview} onClose={() => setProofPreview(null)} />
      )}
    </div>
  );
}

function TransactionRow({
  trx,
  processing,
  onAccept,
  onReject,
  onViewProof,
}: {
  trx: ApiOrganizerTransaction;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onViewProof: () => void;
}) {
  const config = statusConfig[trx.status];
  const StatusIcon = config.icon;
  const totalTickets = trx.items.reduce((sum, i) => sum + i.quantity, 0);
  const canAction = trx.status === "WAITING_FOR_CONFIRMATION";

  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
            >
              <StatusIcon size={14} className={config.color} />
            </div>
            <div>
              <p className={`text-xs font-semibold ${config.color}`}>
                {config.label}
              </p>
              <p className="font-mono text-xs text-white/30">
                {trx.invoiceNumber}
              </p>
            </div>
          </div>

          {/* Event name */}
          <h3 className="mt-3 text-sm font-bold text-white sm:text-base">
            {trx.event.name}
          </h3>

          {/* Customer info */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
            <User size={12} />
            <span className="truncate">
              {trx.user.name} — {trx.user.email}
            </span>
          </div>

          {/* Items */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Ticket size={12} />
              {totalTickets} tiket
            </span>
            <span className="text-white/30">·</span>
            {trx.items.map((item, i) => (
              <span key={i} className="text-white/60">
                {item.quantity}× {item.ticketType.name}
              </span>
            ))}
          </div>

          {/* Date */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
            <CalendarDays size={12} />
            {formatDate(trx.createdAt)}
          </div>
        </div>

        {/* Right: price + actions */}
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="text-right">
            <p className="text-xs text-white/40">Total</p>
            <p className="text-lg font-bold text-white">
              {formatPrice(trx.finalPrice)}
            </p>
            {trx.finalPrice !== trx.totalPrice && (
              <p className="text-xs text-white/30 line-through">
                {formatPrice(trx.totalPrice)}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {trx.paymentProof && (
              <button
                onClick={onViewProof}
                className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/4 px-3 py-1.5 text-xs font-semibold text-white/70 transition-all hover:bg-white/8 hover:text-white"
              >
                <Eye size={13} />
                Bukti
              </button>
            )}

            {canAction && (
              <>
                <button
                  onClick={onReject}
                  disabled={processing}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={13} />
                  Tolak
                </button>
                <button
                  onClick={onAccept}
                  disabled={processing}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {processing ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
                  ) : (
                    <Check size={13} />
                  )}
                  Terima
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Detect if URL is an image
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#0a0a0a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h3 className="text-sm font-bold text-white">Bukti Pembayaran</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-auto p-5">
          {isImage ? (
            <img
              src={url}
              alt="Payment proof"
              className="mx-auto max-h-[60vh] rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-sm text-white/60">
                Bukti pembayaran bukan gambar. Klik di bawah untuk buka di tab
                baru.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          <p className="truncate text-xs text-white/40">{url}</p>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0a0a0a] no-underline transition-colors hover:bg-white/90"
          >
            <ExternalLink size={12} />
            Buka
          </a>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, Upload, AlertTriangle, CalendarDays, MapPin, ArrowLeft, X,
} from "lucide-react";
import {
  fetchTransactionById, uploadPaymentProof, cancelTransaction,
  type TransactionStatus,
} from "@/utils/api";
import { queryKeys } from "@/utils/queryKeys";

function formatPrice(p: number): string {
  if (p === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p);
}
function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function useCountdown(deadline: string | undefined) {
  const [remaining, setRemaining] = useState(() => {
    if (!deadline) return 0;
    return Math.max(0, new Date(deadline).getTime() - Date.now());
  });

  useEffect(() => {
    if (!deadline) {
      setRemaining(0);
      return;
    }
  
    setRemaining(Math.max(0, new Date(deadline).getTime() - Date.now()));

    const interval = setInterval(() => {
      setRemaining(Math.max(0, new Date(deadline).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  return { remaining, hours, minutes, seconds, expired: remaining === 0 };
}

const statusConfig: Record<TransactionStatus, { label: string; color: string; bg: string; border: string }> = {
  WAITING_FOR_PAYMENT: { label: "Menunggu Pembayaran", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  WAITING_FOR_CONFIRMATION: { label: "Menunggu Konfirmasi Organizer", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  DONE: { label: "Berhasil", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  REJECTED: { label: "Ditolak", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  EXPIRED: { label: "Kedaluwarsa", color: "text-white/40", bg: "bg-white/5", border: "border-white/10" },
  CANCELED: { label: "Dibatalkan", color: "text-white/40", bg: "bg-white/5", border: "border-white/10" },
};

export default function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const queryClient = useQueryClient();

  const { data: trx, isLoading } = useQuery({
    queryKey: queryKeys.transactions.byId(transactionId!),
    queryFn: () => fetchTransactionById(transactionId!),
    enabled: !!transactionId,
  });

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadPaymentProof(transactionId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byId(transactionId!) });
      setProofFile(null);
      setProofPreview(null);
    },
    onError: async (err: any) => {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Gagal upload bukti pembayaran");
      } catch {
        setError("Gagal upload. Coba lagi.");
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelTransaction(transactionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byId(transactionId!) });
    },
    onError: async (err: any) => {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Gagal membatalkan");
      } catch {
        setError("Gagal membatalkan. Coba lagi.");
      }
    },
  });


  const countdown = useCountdown(trx?.paymentDeadline);


  if (isLoading || !trx) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  const status = statusConfig[trx.status];

  const handleUpload = () => {
    if (!proofFile) {
      setError("Pilih file bukti pembayaran");
      return;
    }
    setError("");
    uploadMutation.mutate(proofFile);
  };

  const handleCancel = () => {
    if (!confirm("Yakin mau batalin transaksi ini? Tiket bakal dikembalikan.")) return;
    setError("");
    cancelMutation.mutate();
  };

  const canUploadProof = trx.status === "WAITING_FOR_PAYMENT" && !countdown.expired;
  const canCancel = trx.status === "WAITING_FOR_PAYMENT";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/events" className="flex items-center gap-2 text-sm font-semibold text-white/50 no-underline transition-colors hover:text-white">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Ke events</span>
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{trx.invoiceNumber}</p>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className={`rise-in rounded-2xl border ${status.border} ${status.bg} p-5 sm:p-6`}>
          <div className="flex items-start gap-3">
            {trx.status === "DONE" && <CheckCircle2 size={24} className={status.color} />}
            {(trx.status === "WAITING_FOR_PAYMENT" || trx.status === "WAITING_FOR_CONFIRMATION") && <Clock size={24} className={status.color} />}
            {(trx.status === "REJECTED" || trx.status === "EXPIRED" || trx.status === "CANCELED") && <AlertTriangle size={24} className={status.color} />}
            <div className="flex-1">
              <p className={`text-base font-bold ${status.color}`}>{status.label}</p>
              {trx.status === "WAITING_FOR_PAYMENT" && !countdown.expired && (
                <p className="mt-1 text-sm text-white/60">
                  Selesaikan pembayaran dalam{" "}
                  <span className="font-bold tabular-nums text-white">
                    {String(countdown.hours).padStart(2, "0")}:{String(countdown.minutes).padStart(2, "0")}:{String(countdown.seconds).padStart(2, "0")}
                  </span>
                </p>
              )}
              {trx.status === "WAITING_FOR_PAYMENT" && countdown.expired && (
                <p className="mt-1 text-sm text-white/60">Deadline pembayaran udah lewat. Transaksi akan otomatis expired.</p>
              )}
              {trx.status === "WAITING_FOR_CONFIRMATION" && (
                <p className="mt-1 text-sm text-white/60">Bukti pembayaran udah dikirim. Tunggu konfirmasi dari organizer (maks 3 hari).</p>
              )}
              {trx.status === "DONE" && <p className="mt-1 text-sm text-white/60">Tiket kamu udah aktif. Sampai ketemu di event!</p>}
            </div>
          </div>
        </div>

        <section className="rise-in mt-6 rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Event</h2>
          <h3 className="mt-2 text-lg font-bold text-white">{trx.event.name}</h3>
          <div className="mt-3 space-y-1.5 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} />
              <span>{formatDate(trx.event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span>{trx.event.venue}</span>
            </div>
          </div>
        </section>

        <section className="rise-in mt-6 rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Pesanan</h2>
          <div className="mt-3 space-y-2 text-sm">
            {trx.items.map((item, i) => (
              <div key={i} className="flex justify-between text-white/70">
                <span>{item.ticketType.name} × {item.quantity}</span>
                <span>{formatPrice(item.pricePerUnit * item.quantity)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-white/50">
              <span>Subtotal</span>
              <span>{formatPrice(trx.totalPrice)}</span>
            </div>
            {trx.voucher && (
              <div className="flex justify-between text-emerald-400">
                <span>Voucher ({trx.voucher.code})</span>
                <span>-{formatPrice(trx.voucher.discountAmount)}</span>
              </div>
            )}
            {trx.coupon && (
              <div className="flex justify-between text-emerald-400">
                <span>Kupon ({trx.coupon.code})</span>
                <span>-{formatPrice(trx.coupon.discountAmount)}</span>
              </div>
            )}
            {trx.pointsUsed > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Points</span>
                <span>-{formatPrice(trx.pointsUsed)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
              <span>Total Bayar</span>
              <span>{formatPrice(trx.finalPrice)}</span>
            </div>
          </div>
        </section>

        {canUploadProof && (
          <section className="rise-in mt-6 rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Upload Bukti Pembayaran</h2>
            <p className="mt-2 text-xs text-white/40">
              Transfer ke rekening berikut, lalu upload bukti transfer di bawah.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-semibold text-white">Bank BCA</p>
              <p className="mt-1 font-mono text-white/70">1234567890</p>
              <p className="text-white/50">a.n. Eventura Indonesia</p>
              <p className="mt-2 font-bold text-white">Total: {formatPrice(trx.finalPrice)}</p>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">Bukti Transfer</label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-white/3 px-4 py-6 transition-all hover:border-white/30 hover:bg-white/5">
                {proofPreview ? (
                  <img src={proofPreview} alt="Preview" className="max-h-40 rounded-lg" />
                ) : (
                  <>
                    <Upload size={24} className="text-white/30" />
                    <p className="mt-2 text-sm font-semibold text-white/50">Klik untuk pilih file</p>
                    <p className="mt-1 text-xs text-white/30">JPG, PNG, WebP — max 2MB</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProofFile(file);
                      setProofPreview(URL.createObjectURL(file));
                      setError("");
                    }
                  }}
                />
              </label>
              {proofFile && (
                <p className="mt-2 text-xs text-white/40">
                  {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>

            {error && <p className="mt-3 text-xs font-semibold text-red-400">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !proofFile}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploadMutation.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
                ) : (
                  <><Upload size={16} /> Kirim Bukti</>
                )}
              </button>
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-5 py-3 text-sm font-bold text-white/60 transition-all hover:bg-white/8 hover:text-white disabled:opacity-40"
                >
                  <X size={16} />
                  Batal
                </button>
              )}
            </div>
          </section>
        )}

        {trx.paymentProof && (
          <section className="rise-in mt-6 rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Bukti Pembayaran</h2>
            <a href={trx.paymentProof} target="_blank" rel="noopener noreferrer" className="mt-3 block break-all text-sm text-blue-400 no-underline hover:underline">
              {trx.paymentProof}
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
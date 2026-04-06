// apps/platform/src/routes/events/$eventId.checkout.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  X,
  Minus,
  Plus,
  Ticket,
  Tag,
  ChevronRight,
  CalendarDays,
  MapPin,
  Shield,
} from "lucide-react";
import { useState, useMemo } from "react";
import { fetchEventById, verifyVoucher, createTransaction } from "@/utils/api";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/events/$eventId/checkout")({
  component: CheckoutPage,
  loader: async ({ params }) => {
    const event = await fetchEventById(params.eventId);
    return { event };
  },
});

function formatPrice(price: number): string {
  if (price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const categoryGradients: Record<string, string> = {
  conference: "from-[#328f97] to-[#1a5c62]",
  workshop: "from-[#2f6a4a] to-[#1a3d2b]",
  meetup: "from-[#6366f1] to-[#3b3da6]",
  concert: "from-[#e24b4a] to-[#8b2d2d]",
  sports: "from-[#ba7517] to-[#6e4510]",
  party: "from-[#d4537e] to-[#7e3149]",
};

function CheckoutPage() {
  const navigate = useNavigate();
const [checkoutLoading, setCheckoutLoading] = useState(false);
const [checkoutError, setCheckoutError] = useState("");
  const { event } = Route.useLoaderData();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [step] = useState<"ticket" | "payment" | "done">("ticket");

  const categoryKey = event.category.toLowerCase();
  const gradient = categoryGradients[categoryKey] ?? "from-[#328f97] to-[#1a5c62]";

  const updateQty = (ticketId: string, delta: number, maxSeats: number) => {
    setQuantities((prev) => {
      const current = prev[ticketId] || 0;
      const next = Math.max(0, Math.min(Math.min(10, maxSeats), current + delta));
      return { ...prev, [ticketId]: next };
    });
  };

  const subtotal = useMemo(() => {
    return event.ticketTypes.reduce((sum, ticket) => {
      return sum + ticket.price * (quantities[ticket.id] || 0);
    }, 0);
  }, [quantities, event.ticketTypes]);

  const total = Math.max(0, subtotal - voucherDiscount);
  const hasItems = Object.values(quantities).some((q) => q > 0);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError("");
    try {
      const result = await verifyVoucher(event.id, voucherCode.trim());
      setVoucherDiscount(result.discountAmount);
    } catch (err) {
      setVoucherDiscount(0);
      setVoucherError("Voucher nggak valid atau udah expired");
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleCheckout = async () => {
  // 1. Cek login dulu
  const token = localStorage.getItem("token");
  if (!token) {
    navigate({ to: "/auth/login" });
    return;
  }

  // 2. Build items array dari quantities
  const items = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

  if (items.length === 0) {
    setCheckoutError("Pilih minimal 1 tiket");
    return;
  }

  setCheckoutLoading(true);
  setCheckoutError("");

  try {
    const transaction = await createTransaction({
      eventId: event.id,
      items,
      voucherCode: voucherDiscount > 0 ? voucherCode : undefined,
    });

    // Redirect ke halaman payment
    navigate({
      to: "/transactions/$transactionId",
      params: { transactionId: transaction.id },
    });
  } catch (err: any) {
    // ky error — coba ambil message dari response body
    try {
      const body = await err.response?.json();
      setCheckoutError(body?.message || "Gagal membuat transaksi");
    } catch {
      setCheckoutError("Gagal membuat transaksi. Coba lagi.");
    }
  } finally {
    setCheckoutLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Stepper header */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link
            to="/events/$eventId"
            params={{ eventId: event.id }}
            className="flex items-center gap-2 text-sm font-semibold text-white/50 no-underline transition-colors hover:text-white"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Kembali</span>
          </Link>

          <nav className="flex items-center gap-2 text-xs font-semibold sm:gap-3 sm:text-sm">
            <span className={step === "ticket" ? "text-white" : "text-white/40"}>Tiket</span>
            <ChevronRight size={14} className="text-white/20" />
            <span className={step === "payment" ? "text-white" : "text-white/40"}>Pembayaran</span>
            <ChevronRight size={14} className="text-white/20" />
            <span className={step === "done" ? "text-white" : "text-white/40"}>Selesai</span>
          </nav>

          <Link
            to="/events/$eventId"
            params={{ eventId: event.id }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/8 hover:text-white"
          >
            <X size={18} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Event info card */}
        <div className="rise-in flex items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className={`h-16 w-16 shrink-0 rounded-xl bg-linear-to-br ${gradient} sm:h-20 sm:w-20`} />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white sm:text-base">{event.name}</h1>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-white/50 sm:text-sm">
              <CalendarDays size={13} className="shrink-0" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50 sm:text-sm">
              <MapPin size={13} className="shrink-0" />
              <span className="truncate">
                {event.venue}, {event.location}
              </span>
            </div>
          </div>
        </div>

        {/* Ticket types */}
        <section className="rise-in mt-6 space-y-3 sm:mt-8" style={{ animationDelay: "60ms" }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">
            Pilih Tiket
          </h2>

          {event.ticketTypes.length === 0 && (
            <p className="text-sm text-white/50">Belum ada tiket tersedia untuk event ini.</p>
          )}

          {event.ticketTypes.map((ticket) => {
            const qty = quantities[ticket.id] || 0;
            const isSoldOut = ticket.availableSeats === 0;

            return (
              <div
                key={ticket.id}
                className={`rounded-2xl border p-4 transition-all sm:p-5 ${
                  qty > 0
                    ? "border-white/25 bg-white/8"
                    : "border-white/8 bg-white/[0.03]"
                } ${isSoldOut ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8">
                      <Ticket size={18} className="text-white/50" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white sm:text-base">{ticket.name}</p>
                      <p className="mt-0.5 text-base font-bold text-white sm:text-lg">
                        {formatPrice(ticket.price)}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {isSoldOut ? "Habis terjual" : `${ticket.availableSeats} tersisa`}
                      </p>
                    </div>
                  </div>

                  {!isSoldOut && (
                    <div className="flex items-center gap-0">
                      <button
                        onClick={() => updateQty(ticket.id, -1, ticket.availableSeats)}
                        disabled={qty === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-l-xl border border-white/15 bg-white/5 text-white/60 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="flex h-9 w-10 items-center justify-center border-y border-white/15 bg-white/5 text-sm font-bold text-white tabular-nums">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQty(ticket.id, 1, ticket.availableSeats)}
                        disabled={qty >= Math.min(10, ticket.availableSeats)}
                        className="flex h-9 w-9 items-center justify-center rounded-r-xl border border-white/15 bg-white/5 text-white/60 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Voucher */}
        <section className="rise-in mt-6 sm:mt-8" style={{ animationDelay: "120ms" }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">
            Punya kode promo?
          </h2>
          <div className="mt-3 flex gap-2">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5">
              <Tag size={16} className="shrink-0 text-white/30" />
              <input
                type="text"
                placeholder="Masukkan kode voucher"
                value={voucherCode}
                onChange={(e) => {
                  setVoucherCode(e.target.value.toUpperCase());
                  setVoucherDiscount(0);
                  setVoucherError("");
                }}
                className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
            <button
              onClick={handleApplyVoucher}
              disabled={!voucherCode.trim() || voucherLoading}
              className="shrink-0 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {voucherLoading ? "..." : "Pakai"}
            </button>
          </div>
          {voucherDiscount > 0 && (
            <p className="mt-2 text-xs font-semibold text-emerald-400">
              Voucher "{voucherCode}" berhasil! Diskon {formatPrice(voucherDiscount)}
            </p>
          )}
          {voucherError && (
            <p className="mt-2 text-xs font-semibold text-red-400">{voucherError}</p>
          )}
        </section>

        {/* Price breakdown */}
        {hasItems && (
          <section
            className="rise-in mt-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:mt-8 sm:p-5"
            style={{ animationDelay: "180ms" }}
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Ringkasan</h2>
            <div className="mt-3 space-y-2 text-sm">
              {event.ticketTypes.map((ticket) => {
                const qty = quantities[ticket.id] || 0;
                if (qty === 0) return null;
                return (
                  <div key={ticket.id} className="flex justify-between text-white/70">
                    <span>
                      {ticket.name} × {qty}
                    </span>
                    <span>{formatPrice(ticket.price * qty)}</span>
                  </div>
                );
              })}

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Diskon voucher</span>
                  <span>-{formatPrice(voucherDiscount)}</span>
                </div>
              )}

              <div className="mt-2 border-t border-white/10 pt-3">
                <div className="flex justify-between text-base font-bold text-white">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Terms */}
        <div
          className="rise-in mt-6 flex items-start gap-3 text-xs leading-relaxed text-white/35 sm:mt-8"
          style={{ animationDelay: "240ms" }}
        >
          <Shield size={16} className="mt-0.5 shrink-0 text-white/25" />
          <p>
            Dengan melanjutkan pembelian, kamu menyetujui Syarat & Ketentuan dan Kebijakan Privasi
            Eventura. Tiket tidak dapat dipindahtangankan.
          </p>
        </div>

        <div className="h-28" />
      </main>

     {/* Sticky checkout button */}
<div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-[#0a0a0a]/95 p-4 backdrop-blur-xl">
  <div className="mx-auto max-w-3xl">
    {checkoutError && (
      <p className="mb-3 text-center text-xs font-semibold text-red-400">
        {checkoutError}
      </p>
    )}
    <button
      onClick={handleCheckout}
      disabled={!hasItems || checkoutLoading}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold transition-all ${
        hasItems && !checkoutLoading
          ? "bg-[#f5c518] text-[#0a0a0a] hover:bg-[#e6b800] active:scale-[0.98]"
          : "cursor-not-allowed bg-white/10 text-white/30"
      }`}
    >
      {checkoutLoading ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
          Memproses...
        </>
      ) : (
        <>
          <Ticket size={20} />
          {hasItems ? `CHECKOUT — ${formatPrice(total)}` : "Pilih tiket dulu"}
        </>
      )}
    </button>
  </div>
</div>
    </div>
  );
}
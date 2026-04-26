import { Gift, Check, X } from "lucide-react";
import type { ApiUserProfile } from "@/utils/api";

type Coupon = ApiUserProfile["coupons"][number];

interface CouponSelectorProps {
  coupons: Coupon[];
  selectedCouponId: string | null;
  onSelect: (couponId: string | null) => void;
 
  remainingAmount?: number;
}

function formatPrice(p: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(p);
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CouponSelector({
  coupons,
  selectedCouponId,
  onSelect,
  remainingAmount,
}: CouponSelectorProps) {
  if (coupons.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-5 text-center">
        <Gift size={20} className="mx-auto text-white/30" />
        <p className="mt-2 text-sm font-semibold text-white/60">
          Belum ada kupon
        </p>
        <p className="mt-1 text-xs text-white/40">
          Ajak temen daftar pake referral code kamu buat dapet kupon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Pilih Kupon ({coupons.length} tersedia)
        </p>
        {selectedCouponId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="flex items-center gap-1 text-xs font-semibold text-white/50 hover:text-white"
          >
            <X size={12} />
            Batal pakai
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {coupons.map((coupon) => {
          const isSelected = selectedCouponId === coupon.id;
          const isExpired = new Date(coupon.expiresAt) < new Date();
          const isTooBig =
            remainingAmount !== undefined &&
            remainingAmount === 0;
          const disabled = isExpired || isTooBig;

          return (
            <button
              key={coupon.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(isSelected ? null : coupon.id)}
              className={`group relative flex items-center justify-between overflow-hidden rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-pink-400/40 bg-gradient-to-br from-pink-500/15 to-transparent"
                  : "border-dashed border-white/15 bg-white/3 hover:border-white/30 hover:bg-white/5"
              } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pink-400">
                  <Gift size={12} />
                  Diskon
                </div>
                <p className="mt-1 text-lg font-bold text-white">
                  {formatPrice(coupon.discountAmount)}
                </p>
                <code className="mt-1 inline-block rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white/80">
                  {coupon.code}
                </code>
                <p className="mt-2 text-xs text-white/40">
                  Berlaku sampai {formatDate(coupon.expiresAt)}
                </p>
              </div>

              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-400"
                    : "border-white/20"
                }`}
              >
                {isSelected && <Check size={13} className="text-[#0a0a0a]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
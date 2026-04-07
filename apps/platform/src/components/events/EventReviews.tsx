import { useState, useEffect } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import {
  fetchEventReviews,
  fetchMyTransactions,
  createReview,
  type ApiReview,
} from "@/utils/api";

interface EventReviewsProps {
  eventId: string;
  eventEndDate: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EventReviews({ eventId, eventEndDate }: EventReviewsProps) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  // Form state
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const eventEnded = new Date(eventEndDate) < new Date();
  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem("token");

  // Load reviews + check eligibility
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // Fetch reviews (public, no auth needed)
        const reviewData = await fetchEventReviews(eventId, { limit: 20 });
        if (cancelled) return;
        setReviews(reviewData.reviews);
        setSummary(reviewData.summary);

        // Check eligibility: event ended + user logged in + has DONE transaction
        if (!eventEnded || !isLoggedIn) return;

        // Cek user udah review atau belum
        const userJson = localStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          const hasReviewed = reviewData.reviews.some(
            (r) => r.user.id === user.id
          );
          if (hasReviewed) {
            setAlreadyReviewed(true);
            return;
          }
        }

        // Cek user punya DONE transaction untuk event ini
        const trxData = await fetchMyTransactions({
          status: "DONE",
          limit: 50,
        });
        if (cancelled) return;

        const attended = trxData.transactions.some(
          (t) => t.event.id === eventId
        );
        setCanReview(attended);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, eventEnded, isLoggedIn]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Pilih rating dulu ya");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const newReview = await createReview(eventId, {
        rating,
        comment: comment.trim() || undefined,
      });

      // Update UI optimistically
      setReviews((prev) => [newReview, ...prev]);
      setSummary((prev) => {
        const newTotal = prev.totalReviews + 1;
        const newAvg =
          (prev.averageRating * prev.totalReviews + rating) / newTotal;
        return {
          averageRating: Math.round(newAvg * 10) / 10,
          totalReviews: newTotal,
        };
      });

      // Reset form
      setRating(0);
      setComment("");
      setCanReview(false);
      setAlreadyReviewed(true);
    } catch (err: any) {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Gagal submit review");
      } catch {
        setError("Gagal submit review. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-base font-bold text-white sm:text-lg">Reviews</h2>
        <div className="mt-4 h-20 animate-pulse rounded-xl border border-white/8 bg-white/4" />
      </div>
    );
  }

  return (
    <div>
      {/* Header with summary */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white sm:text-lg">Reviews</h2>
        {summary.totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-white">
                {summary.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-white/40">
              ({summary.totalReviews} {summary.totalReviews === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>

      {/* Submit form — only if eligible */}
      {canReview && !alreadyReviewed && (
        <div className="mt-4 rounded-2xl border border-white/12 bg-white/5 p-5">
          <p className="text-sm font-bold text-white">
            Kamu pernah hadir. Kasih rating dong!
          </p>
          <p className="mt-1 text-xs text-white/40">
            Rating kamu membantu customer lain buat memilih event.
          </p>

          {/* Star rating picker */}
          <div className="mt-4 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = (hoveredRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="rounded p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={
                      filled
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white/20"
                    }
                  />
                </button>
              );
            })}
            {rating > 0 && (
              <span className="ml-2 text-sm font-semibold text-white/60">
                {rating} / 5
              </span>
            )}
          </div>

          {/* Comment textarea */}
          <textarea
            placeholder="Cerita pengalaman kamu... (opsional)"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError("");
            }}
            rows={3}
            maxLength={500}
            className="mt-4 w-full resize-none rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 font-[inherit] text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
          />
          <p className="mt-1 text-right text-xs text-white/30">
            {comment.length}/500
          </p>

          {error && (
            <p className="mt-2 text-xs font-semibold text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
            ) : (
              <>
                <Send size={15} />
                Kirim Review
              </>
            )}
          </button>
        </div>
      )}

      {/* Info states */}
      {alreadyReviewed && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          ✓ Kamu udah kasih review untuk event ini. Makasih!
        </div>
      )}

      {!canReview && !alreadyReviewed && !eventEnded && (
        <p className="mt-4 text-xs text-white/40">
          Review bisa diberikan setelah event selesai.
        </p>
      )}

      {!canReview && !alreadyReviewed && eventEnded && isLoggedIn && (
        <p className="mt-4 text-xs text-white/40">
          Hanya customer yang pernah hadir yang bisa kasih review.
        </p>
      )}

      {/* Review list */}
      {reviews.length > 0 ? (
        <div className="mt-5 space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-6">
          <MessageSquare size={20} className="shrink-0 text-white/30" />
          <p className="text-sm text-white/50">
            Belum ada review untuk event ini.
          </p>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: ApiReview }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
          {review.user.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-white">{review.user.name}</p>
            <p className="text-xs text-white/30">{formatDate(review.createdAt)}</p>
          </div>

          {/* Rating stars */}
          <div className="mt-1 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={13}
                className={
                  star <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/15"
                }
              />
            ))}
          </div>

          {review.comment && (
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { useState } from "react";
import {
  User,
  Mail,
  Gift,
  Copy,
  Check,
  Sparkles,
  Ticket,
  LogOut,
  ChevronRight,
  CalendarDays,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pencil,
  Lock,
  Save,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  fetchProfile,
  fetchMyTransactions,
  updateProfile,
  changePassword,
  type ApiUserProfile,
  type ApiTransactionListItem,
  type TransactionStatus,
} from "@/utils/api";
import { BrowseLayout } from "@/components/events/BrowseLayout";
import { BrowseHeader } from "@/components/events/BrowseHeader";
import { logout, isAuthenticated } from "@/utils/auth";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  ssr: false,
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/auth/login" });
    }
  },
  loader: async () => {
    const [profile, transactionsData] = await Promise.all([
      fetchProfile(),
      fetchMyTransactions({ limit: 20 }),
    ]);
    return { profile, transactions: transactionsData.transactions };
  },
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
      <div className="text-center">
        <p className="text-lg font-semibold">Gagal memuat profile</p>
        <p className="mt-2 text-sm text-white/40">{String(error)}</p>
        <Link
          to="/auth/login"
          className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0a0a0a] no-underline"
        >
          Login ulang
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

function formatDate(dateStr: string, withTime = false): string {
  const d = new Date(dateStr);
  if (withTime) {
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig: Record<
  TransactionStatus,
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  WAITING_FOR_PAYMENT: {
    label: "Menunggu Pembayaran",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    icon: Clock,
  },
  WAITING_FOR_CONFIRMATION: {
    label: "Menunggu Konfirmasi",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: Clock,
  },
  DONE: {
    label: "Berhasil",
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
    label: "Kedaluwarsa",
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

function ProfilePage() {
  const { profile: initialProfile, transactions } = Route.useLoaderData();

  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialProfile);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "ALL">(
    "ALL",
  );

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile.name,
    profileImage: profile.profileImage || "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Change password state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(profile.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: nothing
    }
  };

  const handleLogout = () => {
    if (!confirm("Yakin mau logout?")) return;
    logout();
    navigate({ to: "/auth/login" });
  };

  const handleEditSubmit = async () => {
    if (!editForm.name || editForm.name.length < 2) {
      setEditError("Nama minimal 2 karakter");
      return;
    }

    setEditSaving(true);
    setEditError("");
    setEditSuccess("");

    try {
      const updated = await updateProfile(
        { name: editForm.name },
        profileFile || undefined,
      );
      setProfile((prev) => ({
        ...prev,
        name: updated.name,
        profileImage: updated.profileImage,
      }));
      setProfileFile(null);
      setProfilePreview(null);
      setEditSuccess("Profil berhasil diupdate!");
      setTimeout(() => {
        setEditSuccess("");
        setEditOpen(false);
      }, 1500);
    } catch (err: any) {
      try {
        const body = await err.response?.json();
        setEditError(body?.message || "Gagal update profil");
      } catch {
        setEditError("Gagal update profil. Coba lagi.");
      }
    } finally {
      setEditSaving(false);
    }
  };

  // ========== Change Password ==========
  const handlePwSubmit = async () => {
    if (!pwForm.currentPassword) {
      setPwError("Password lama wajib diisi");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError("Password baru minimal 6 karakter");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Konfirmasi password tidak cocok");
      return;
    }

    setPwSaving(true);
    setPwError("");
    setPwSuccess("");

    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess("Password berhasil diubah!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setPwSuccess("");
        setPwOpen(false);
      }, 1500);
    } catch (err: any) {
      try {
        const body = await err.response?.json();
        setPwError(body?.message || "Gagal ubah password");
      } catch {
        setPwError("Gagal ubah password. Coba lagi.");
      }
    } finally {
      setPwSaving(false);
    }
  };

  const filteredTransactions =
    statusFilter === "ALL"
      ? transactions
      : transactions.filter((t) => t.status === statusFilter);

  return (
    <BrowseLayout>
      <BrowseHeader search={search} onSearchChange={setSearch} />

      <main className="page-wrap py-6 sm:py-10">
        {/* Header */}
        <div className="rise-in flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/8 text-2xl font-bold text-white sm:h-20 sm:w-20 sm:text-3xl">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h1 className="display-title text-2xl font-bold text-white sm:text-3xl">
                {profile.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
                <Mail size={14} />
                <span className="truncate">{profile.email}</span>
              </p>
              <span className="mt-2 inline-block rounded-full bg-white/8 px-2.5 py-0.5 text-xs font-semibold text-white/60">
                {profile.role}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                setEditOpen(!editOpen);
                setPwOpen(false);
                setEditForm({
                  name: profile.name,
                  profileImage: profile.profileImage || "",
                });
                setEditError("");
                setEditSuccess("");
              }}
              className="flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-white/60 transition-all hover:bg-white/8 hover:text-white"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/4 px-4 py-2 text-sm font-semibold text-white/60 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>

        {/* ========== Edit Profile Section ========== */}
        {editOpen && (
          <section className="rise-in mt-6 rounded-2xl border border-white/12 bg-white/5 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
                <Pencil size={14} />
                Edit Profil
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-xs font-semibold text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Nama
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 focus-within:border-white/30">
                  <User size={16} className="shrink-0 text-white/30" />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                      setEditError("");
                    }}
                    className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>
              </div>

              {/* Profile Image URL */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Foto Profil
                </label>
                <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/12 bg-white/5 px-3.5 py-3 transition-all hover:border-white/30">
                  {/* Preview */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                    {profilePreview || profile.profileImage ? (
                      <img
                        src={profilePreview || profile.profileImage || ""}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-white/30" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">
                      {profileFile ? profileFile.name : "Pilih foto baru"}
                    </p>
                    <p className="text-xs text-white/30">
                      JPG, PNG, WebP — max 2MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfileFile(file);
                        setProfilePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>

              {editError && (
                <p className="text-xs font-semibold text-red-400">
                  {editError}
                </p>
              )}
              {editSuccess && (
                <p className="text-xs font-semibold text-emerald-400">
                  {editSuccess}
                </p>
              )}

              <button
                onClick={handleEditSubmit}
                disabled={editSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {editSaving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
                ) : (
                  <>
                    <Save size={15} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>

            {/* Change Password toggle */}
            <div className="mt-5 border-t border-white/10 pt-5">
              <button
                onClick={() => {
                  setPwOpen(!pwOpen);
                  setPwError("");
                  setPwSuccess("");
                  setPwForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
              >
                <Lock size={14} />
                {pwOpen ? "Tutup Ganti Password" : "Ganti Password"}
              </button>

              {pwOpen && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
                      Password Lama
                    </label>
                    <input
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={(e) => {
                        setPwForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }));
                        setPwError("");
                      }}
                      className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 font-[inherit] text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                      placeholder="Masukkan password lama"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={(e) => {
                        setPwForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }));
                        setPwError("");
                      }}
                      className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 font-[inherit] text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={(e) => {
                        setPwForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }));
                        setPwError("");
                      }}
                      className="w-full rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 font-[inherit] text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30"
                      placeholder="Ulangi password baru"
                    />
                  </div>

                  {pwError && (
                    <p className="text-xs font-semibold text-red-400">
                      {pwError}
                    </p>
                  )}
                  {pwSuccess && (
                    <p className="text-xs font-semibold text-emerald-400">
                      {pwSuccess}
                    </p>
                  )}

                  <button
                    onClick={handlePwSubmit}
                    disabled={pwSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/8 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {pwSaving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    ) : (
                      <>
                        <Lock size={15} />
                        Ubah Password
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats cards */}
        <div
          className="rise-in mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4"
          style={{ animationDelay: "60ms" }}
        >
          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#2f6a4a]/20 to-transparent p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Sparkles size={14} />
              Points
            </div>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {profile.totalPoints.toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-xs text-white/40">
              Expire dalam 3 bulan setelah diperoleh
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#328f97]/20 to-transparent p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#60d7cf]">
              <Ticket size={14} />
              Coupons
            </div>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {profile.coupons.length}
            </p>
            <p className="mt-1 text-xs text-white/40">Kupon aktif</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#6366f1]/20 to-transparent p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <CalendarDays size={14} />
              Transactions
            </div>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {transactions.length}
            </p>
            <p className="mt-1 text-xs text-white/40">Total semua waktu</p>
          </div>
        </div>

        {/* Referral code card */}
        <section
          className="rise-in mt-6 rounded-2xl border border-white/8 bg-white/4 p-5 sm:mt-8 sm:p-6"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            <Gift size={14} />
            Referral Code
          </div>
          <p className="mt-2 text-sm text-white/50">
            Bagikan kode ini ke teman. Kamu dapat 10.000 points, teman kamu
            dapat kupon diskon Rp 50.000.
          </p>

          <div className="mt-4 flex items-stretch gap-2">
            <div className="flex flex-1 items-center rounded-xl border border-white/12 bg-white/5 px-4 py-3">
              <code className="font-mono text-lg font-bold tracking-widest text-white">
                {profile.referralCode}
              </code>
            </div>
            <button
              onClick={handleCopyReferral}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white text-[#0a0a0a] hover:bg-white/90"
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>
          </div>
        </section>

        {/* Active coupons */}
        {profile.coupons.length > 0 && (
          <section
            className="rise-in mt-6 sm:mt-8"
            style={{ animationDelay: "180ms" }}
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">
              Kupon Aktif
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="relative overflow-hidden rounded-2xl border border-dashed border-white/20 bg-gradient-to-br from-[#d4537e]/15 to-transparent p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                        Diskon
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">
                        {formatPrice(coupon.discountAmount)}
                      </p>
                      <code className="mt-2 inline-block rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white/80">
                        {coupon.code}
                      </code>
                    </div>
                    <Gift size={24} className="text-white/20" />
                  </div>
                  <p className="mt-3 text-xs text-white/40">
                    Berlaku sampai {formatDate(coupon.expiresAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Transactions */}
        <section
          className="rise-in mt-8 sm:mt-10"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              Riwayat Transaksi
            </h2>
          </div>

          <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {(
              [
                ["ALL", "Semua"],
                ["WAITING_FOR_PAYMENT", "Menunggu Bayar"],
                ["WAITING_FOR_CONFIRMATION", "Menunggu Konfirmasi"],
                ["DONE", "Berhasil"],
                ["EXPIRED", "Expired"],
                ["CANCELED", "Dibatalkan"],
                ["REJECTED", "Ditolak"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() =>
                  setStatusFilter(key as TransactionStatus | "ALL")
                }
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === key
                    ? "border-white/30 bg-white text-[#0a0a0a]"
                    : "border-white/12 bg-white/4 text-white/60 hover:bg-white/8"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="mt-4 space-y-3 sm:mt-6">
              {filteredTransactions.map((trx) => (
                <TransactionRow key={trx.id} trx={trx} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 py-12 text-center">
              <p className="text-sm font-semibold text-white/60">
                Belum ada transaksi
              </p>
              <p className="mt-1 text-xs text-white/40">
                {statusFilter === "ALL"
                  ? "Coba browse events dan beli tiket pertama kamu!"
                  : "Tidak ada transaksi dengan status ini"}
              </p>
              {statusFilter === "ALL" && (
                <Link
                  to="/events"
                  className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0a0a0a] no-underline"
                >
                  Browse Events
                </Link>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-10 border-t border-white/8 sm:mt-12">
        <div className="page-wrap flex flex-col items-center gap-4 py-6 text-sm text-white/30 sm:flex-row sm:justify-between sm:py-8">
          <p>© 2026 Eventura</p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-white/30 no-underline hover:text-white/50"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-white/30 no-underline hover:text-white/50"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-white/30 no-underline hover:text-white/50"
            >
              Help
            </a>
          </div>
        </div>
      </footer>
    </BrowseLayout>
  );
}

function TransactionRow({ trx }: { trx: ApiTransactionListItem }) {
  const config = statusConfig[trx.status];
  const StatusIcon = config.icon;
  const totalTickets = trx.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Link
      to="/transactions/$transactionId"
      params={{ transactionId: trx.id }}
      className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/4 p-4 no-underline transition-all hover:border-white/18 hover:bg-white/8 sm:p-5"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.bg}`}
      >
        <StatusIcon size={20} className={config.color} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-white sm:text-base">
            {trx.event.name}
          </p>
          <p className="shrink-0 text-sm font-bold text-white sm:text-base">
            {formatPrice(trx.finalPrice)}
          </p>
        </div>

        <p className={`mt-0.5 text-xs font-semibold ${config.color}`}>
          {config.label}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Ticket size={11} />
            {totalTickets} tiket
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            <span className="truncate">{trx.event.venue}</span>
          </span>
          <span className="font-mono text-white/30">{trx.invoiceNumber}</span>
        </div>

        <p className="mt-1 text-xs text-white/30">
          {formatDate(trx.createdAt, true)}
        </p>
      </div>

      <ChevronRight
        size={18}
        className="shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

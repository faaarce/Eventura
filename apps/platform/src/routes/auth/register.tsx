import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import Cookies from "js-cookie";
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Gift,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { decodeToken } from "@/utils/auth";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER" as "CUSTOMER" | "ORGANIZER",
    referralCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Semua field wajib diisi");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          ...(form.referralCode && { referralCode: form.referralCode }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registrasi gagal");
        return;
      }

      // Save token & redirect
      Cookies.set("token", data.data.token, { expires: 1 });
      const user = decodeToken(data.data.token);
      if (user?.role === "ORGANIZER") {
        navigate({ to: "/organizer/dashboard" });
      } else {
        navigate({ to: "/events" });
      }
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-12">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#328f97]/8 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-[#6366f1]/6 blur-[100px]" />
      </div>

      <div className="rise-in relative w-full max-w-md">
        {/* Logo */}
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2.5 no-underline"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
            <Sparkles size={18} className="text-[#0a0a0a]" strokeWidth={2.5} />
          </span>
          <span
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Eventura
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          <h1 className="text-center text-2xl font-bold text-white">
            Buat Akun Baru
          </h1>
          <p className="mt-2 text-center text-sm text-white/40">
            Bergabung dan temukan event terbaik
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {/* Role toggle */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                Daftar sebagai
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update("role", "CUSTOMER")}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    form.role === "CUSTOMER"
                      ? "border-white/30 bg-white text-[#0a0a0a]"
                      : "border-white/12 bg-white/4 text-white/50 hover:bg-white/8"
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => update("role", "ORGANIZER")}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    form.role === "ORGANIZER"
                      ? "border-white/30 bg-white text-[#0a0a0a]"
                      : "border-white/12 bg-white/4 text-white/50 hover:bg-white/8"
                  }`}
                >
                  Organizer
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                Nama lengkap
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 focus-within:border-white/30 transition-colors">
                <User size={16} className="shrink-0 text-white/30" />
                <input
                  type="text"
                  placeholder="Masukkan nama kamu"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 font-[inherit]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                Email
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 focus-within:border-white/30 transition-colors">
                <Mail size={16} className="shrink-0 text-white/30" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 font-[inherit]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                Password
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 focus-within:border-white/30 transition-colors">
                <Lock size={16} className="shrink-0 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 font-[inherit]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Referral code */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                Kode Referral{" "}
                <span className="text-white/25 normal-case">(opsional)</span>
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 focus-within:border-white/30 transition-colors">
                <Gift size={16} className="shrink-0 text-white/30" />
                <input
                  type="text"
                  placeholder="Contoh: 7UTLKNFU"
                  value={form.referralCode}
                  onChange={(e) =>
                    update("referralCode", e.target.value.toUpperCase())
                  }
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25 font-[inherit]"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs text-white/25">atau</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-white/40">
            Sudah punya akun?{" "}
            <Link
              to="/auth/login"
              className="font-semibold text-white no-underline hover:text-white/80"
            >
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/20">
          Dengan mendaftar, kamu menyetujui Syarat & Ketentuan Eventura
        </p>
      </div>
    </div>
  );
}

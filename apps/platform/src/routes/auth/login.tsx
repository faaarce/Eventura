import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { userAtom } from "@/stores/auth";
import { loginApi } from "@/utils/api";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setUser = useSetAtom(userAtom); // ← Jotai setter
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      // loginApi return user, cookies di-set otomatis oleh backend
      const user = await loginApi(form);

      // Simpan user ke Jotai (auto-persist ke localStorage)
      setUser(user);

      // Redirect based on role
      if (user.role === "ORGANIZER") {
        navigate({ to: "/organizer/dashboard" });
      } else {
        navigate({ to: "/events" });
      }
    } catch (err: any) {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Login gagal");
      } catch {
        setError("Tidak bisa terhubung ke server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#328f97]/8 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-[#d4537e]/5 blur-[100px]" />
      </div>

      <div className="rise-in relative w-full max-w-md">
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

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          <h1 className="text-center text-2xl font-bold text-white">
            Selamat Datang
          </h1>
          <p className="mt-2 text-center text-sm text-white/40">
            Masuk ke akun Eventura kamu
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-semibold text-white/30 no-underline hover:text-white/50 transition-colors"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 focus-within:border-white/30 transition-colors">
                <Lock size={16} className="shrink-0 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit(e);
                  }}
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

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
              ) : (
                <>
                  Masuk
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs text-white/25">atau</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <p className="mt-6 text-center text-sm text-white/40">
            Belum punya akun?{" "}
            <Link
              to="/auth/register"
              className="font-semibold text-white no-underline hover:text-white/80"
            >
              Daftar gratis
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/20">
          © 2026 Eventura. All rights reserved.
        </p>
      </div>
    </div>
  );
}
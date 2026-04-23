import { Link, useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { userAtom } from "@/stores/auth";
import { loginApi, googleLoginApi } from "@/utils/api";
import { useGoogleLogin } from "@react-oauth/google";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useSetAtom(userAtom);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

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
      const user = await loginApi(form);
      queryClient.clear();
      setUser(user);
      if (user.role === "ORGANIZER") navigate("/organizer/dashboard");
      else navigate("/events");
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

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setGoogleLoading(true);
      setError("");
      try {
        const result = await googleLoginApi(access_token);
        queryClient.clear();
        setUser(result.user);
        if (result.user.role === "ORGANIZER") navigate("/organizer/dashboard");
        else navigate("/events");
      } catch (err: any) {
        try {
          const body = await err.response?.json();
          setError(body?.message || "Login dengan Google gagal");
        } catch {
          setError("Login dengan Google gagal");
        }
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google login dibatalkan atau gagal"),
  });

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
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                Email
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 transition-colors focus-within:border-white/30">
                <Mail size={16} className="shrink-0 text-white/30" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/25"
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
                  className="text-xs font-semibold text-white/30 no-underline transition-colors hover:text-white/50"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 transition-colors focus-within:border-white/30">
                <Lock size={16} className="shrink-0 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit(e);
                  }}
                  className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="shrink-0 text-white/30 transition-colors hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || googleLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
              ) : (
                <>
                  Masuk <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs text-white/25">atau</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={loading || googleLoading}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/4 px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="h-5 w-5"
                >
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.7 6.1 29.1 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.1 0 9.8-2 13.4-5.3l-6.2-5.1C29.1 35.9 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.3 5.4-6.1 6.9l6.2 5.1C36.9 37.5 40 31.2 40 24c0-1.3-.1-2.7-.4-3.5z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

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

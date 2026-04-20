import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { resetPassword } from "@/utils/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (form.newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, form.newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/auth/login"), 3000);
    } catch (err: any) {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Gagal reset password");
      } catch {
        setError("Tidak bisa terhubung ke server");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-12">
        <div className="rise-in relative w-full max-w-md text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white">Link Tidak Valid</h1>
            <p className="mt-3 text-sm text-white/50">
              Token reset password tidak ditemukan. Pastikan kamu klik link dari email, atau request ulang.
            </p>
            <Link to="/auth/forgot-password" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0a0a0a] no-underline">
              Request Ulang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#328f97]/8 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-[#6366f1]/6 blur-[100px]" />
      </div>

      <div className="rise-in relative w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
            <Sparkles size={18} className="text-[#0a0a0a]" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-bold text-white" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Eventura
          </span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-white">Password Berhasil Direset!</h1>
              <p className="mt-3 text-sm text-white/50">
                Password baru kamu sudah aktif. Kamu akan diarahkan ke login dalam beberapa detik...
              </p>
              <Link to="/auth/login" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0a0a0a] no-underline">
                Masuk Sekarang <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-center text-2xl font-bold text-white">Buat Password Baru</h1>
              <p className="mt-2 text-center text-sm text-white/40">Masukkan password baru untuk akun kamu</p>

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">Password Baru</label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 transition-colors focus-within:border-white/30">
                    <Lock size={16} className="shrink-0 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={form.newPassword}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, newPassword: e.target.value }));
                        setError("");
                      }}
                      className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/25"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-white/30 transition-colors hover:text-white/60">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">Konfirmasi Password</label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 px-3.5 py-2.5 transition-colors focus-within:border-white/30">
                    <Lock size={16} className="shrink-0 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      value={form.confirmPassword}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, confirmPassword: e.target.value }));
                        setError("");
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                      className="w-full bg-transparent font-[inherit] text-sm text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
                  ) : (
                    <>Reset Password <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/20">© 2026 Eventura. All rights reserved.</p>
      </div>
    </div>
  );
}
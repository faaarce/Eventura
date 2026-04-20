import { Link } from "react-router-dom"
import {
  Sparkles,
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { forgotPassword } from "@/utils/api";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Gagal mengirim email");
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
          {sent ? (

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-white">
                Email Terkirim!
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Kalau email <strong className="text-white/80">{email}</strong>{" "}
                terdaftar di Eventura, kamu akan menerima link untuk reset
                password. Cek inbox dan folder spam.
              </p>
              <p className="mt-4 text-xs text-white/30">Link berlaku 1 jam.</p>
              <Link
                to="/auth/login"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/4 px-6 py-3.5 text-sm font-bold text-white/70 no-underline transition-all hover:bg-white/8 hover:text-white"
              >
                <ArrowLeft size={16} />
                Kembali ke Login
              </Link>
            </div>
          ) : (

            <>
              <h1 className="text-center text-2xl font-bold text-white">
                Lupa Password
              </h1>
              <p className="mt-2 text-center text-sm text-white/40">
                Masukkan email kamu dan kami akan kirim link untuk reset
                password
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
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit();
                      }}
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
                    <>
                      Kirim Link Reset
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-white/40">
                Ingat password kamu?{" "}
                <Link
                  to="/auth/login"
                  className="font-semibold text-white no-underline hover:text-white/80"
                >
                  Masuk di sini
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/20">
          © 2026 Eventura. All rights reserved.
        </p>
      </div>
    </div>
  );
}

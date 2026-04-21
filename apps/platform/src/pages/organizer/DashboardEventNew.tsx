import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, CalendarDays, MapPin, Ticket, Image as ImageIcon, Save,
} from "lucide-react";
import { createEvent } from "@/utils/api";
import { queryKeys } from "@/utils/queryKeys";

const CATEGORIES = ["conference", "workshop", "meetup", "concert", "sports", "party"];

interface TicketTypeForm {
  name: string;
  price: string;
  totalSeats: string;
}

export default function DashboardEventNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "conference",
    location: "",
    venue: "",
    startDate: "",
    endDate: "",
    isFree: false,
    imageUrl: "",
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    { name: "Regular", price: "", totalSeats: "" },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const updateTicket = (index: number, field: keyof TicketTypeForm, value: string) => {
    setTicketTypes((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
    setError("");
  };

  const addTicketType = () => {
    setTicketTypes((prev) => [...prev, { name: "", price: "", totalSeats: "" }]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length === 1) return;
    setTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: ({ input, file }: { input: Parameters<typeof createEvent>[0]; file?: File }) =>
      createEvent(input, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      navigate("/organizer/dashboard/events");
    },
    onError: async (err: any) => {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Gagal membuat event");
      } catch {
        setError("Gagal membuat event. Coba lagi.");
      }
    },
  });

  const handleSubmit = () => {
    if (!form.name || form.name.length < 3) { setError("Nama event minimal 3 karakter"); return; }
    if (!form.description || form.description.length < 10) { setError("Deskripsi minimal 10 karakter"); return; }
    if (!form.location || !form.venue) { setError("Lokasi dan venue wajib diisi"); return; }
    if (!form.startDate || !form.endDate) { setError("Tanggal mulai dan selesai wajib diisi"); return; }
    if (new Date(form.startDate) >= new Date(form.endDate)) { setError("Tanggal selesai harus setelah tanggal mulai"); return; }
    if (new Date(form.startDate) <= new Date()) { setError("Tanggal mulai harus di masa depan"); return; }

    for (let i = 0; i < ticketTypes.length; i++) {
      const t = ticketTypes[i];
      if (!t.name) { setError(`Nama ticket type #${i + 1} wajib diisi`); return; }
      if (!t.totalSeats || parseInt(t.totalSeats) < 1) { setError(`Jumlah kursi ticket type #${i + 1} minimal 1`); return; }
      if (!form.isFree && (t.price === "" || parseInt(t.price) < 0)) {
        setError(`Harga ticket type #${i + 1} wajib diisi`);
        return;
      }
    }

    setError("");
    createMutation.mutate({
      input: {
        name: form.name,
        description: form.description,
        category: form.category,
        location: form.location,
        venue: form.venue,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        isFree: form.isFree,
        imageUrl: form.imageUrl || undefined,
        ticketTypes: ticketTypes.map((t) => ({
          name: t.name,
          price: form.isFree ? 0 : parseInt(t.price),
          totalSeats: parseInt(t.totalSeats),
        })),
      },
      file: imageFile || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/organizer/dashboard/events" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/50 no-underline transition-colors hover:text-white">
        <ArrowLeft size={16} />
        Kembali ke Events
      </Link>

      <h1 className="display-title text-2xl font-bold text-white sm:text-3xl">Buat Event Baru</h1>
      <p className="mt-1 text-sm text-white/50">Isi detail event kamu di bawah ini</p>

      <div className="mt-6 space-y-6">
        <section className="rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Info Dasar</h2>

          <div className="mt-4 space-y-4">
            <FormField label="Nama Event">
              <input
                type="text"
                placeholder="Contoh: Palembang Tech Conference 2026"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="form-input"
              />
            </FormField>

            <FormField label="Kategori">
              <select value={form.category} onChange={(e) => updateField("category", e.target.value)} className="form-input">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Deskripsi">
              <textarea
                placeholder="Jelaskan tentang event kamu..."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={5}
                className="form-input resize-none"
              />
            </FormField>

            <FormField label="Gambar Event (opsional)">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-white/3 px-4 py-6 transition-all hover:border-white/30 hover:bg-white/5">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
                ) : (
                  <>
                    <ImageIcon size={24} className="text-white/30" />
                    <p className="mt-2 text-sm font-semibold text-white/50">Klik untuk upload gambar</p>
                    <p className="mt-1 text-xs text-white/30">JPG, PNG, WebP — max 5MB</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
              {imageFile && (
                <p className="mt-2 text-xs text-white/40">
                  {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </FormField>
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
            <MapPin size={14} />
            Lokasi
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Kota">
              <input
                type="text"
                placeholder="Contoh: Palembang"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Venue">
              <input
                type="text"
                placeholder="Contoh: Palembang Convention Center"
                value={form.venue}
                onChange={(e) => updateField("venue", e.target.value)}
                className="form-input"
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
            <CalendarDays size={14} />
            Tanggal & Waktu
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Mulai">
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Selesai">
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className="form-input"
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
            <Ticket size={14} />
            Jenis Tiket
          </h2>

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-white/12 bg-white/5 p-3">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => updateField("isFree", e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-white"
            />
            <div>
              <p className="text-sm font-semibold text-white">Event Gratis</p>
              <p className="text-xs text-white/40">Semua tiket akan diset ke harga Rp 0</p>
            </div>
          </label>

          <div className="mt-4 space-y-3">
            {ticketTypes.map((ticket, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-white/3 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Tiket #{index + 1}
                  </p>
                  {ticketTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketType(index)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FormField label="Nama" compact>
                    <input
                      type="text"
                      placeholder="Early Bird"
                      value={ticket.name}
                      onChange={(e) => updateTicket(index, "name", e.target.value)}
                      className="form-input-sm"
                    />
                  </FormField>
                  <FormField label={`Harga (Rp)${form.isFree ? " — Gratis" : ""}`} compact>
                    <input
                      type="number"
                      placeholder="75000"
                      value={ticket.price}
                      onChange={(e) => updateTicket(index, "price", e.target.value)}
                      disabled={form.isFree}
                      min={0}
                      className="form-input-sm disabled:opacity-40"
                    />
                  </FormField>
                  <FormField label="Jumlah Kursi" compact>
                    <input
                      type="number"
                      placeholder="100"
                      value={ticket.totalSeats}
                      onChange={(e) => updateTicket(index, "totalSeats", e.target.value)}
                      min={1}
                      className="form-input-sm"
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTicketType}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/2 py-3 text-sm font-semibold text-white/60 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            <Plus size={15} />
            Tambah Jenis Tiket
          </button>
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/organizer/dashboard/events"
            className="flex items-center justify-center rounded-xl border border-white/12 bg-white/4 px-5 py-3 text-sm font-semibold text-white/70 no-underline transition-all hover:bg-white/8 hover:text-white"
          >
            Batal
          </Link>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {createMutation.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                Buat Event
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label, children, compact = false,
}: { label: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div>
      <label className={`mb-1.5 block font-semibold uppercase tracking-wider text-white/50 ${
        compact ? "text-[10px]" : "text-xs"
      }`}>
        {label}
      </label>
      {children}
    </div>
  );
}
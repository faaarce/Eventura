import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, CalendarDays, MapPin, Image as ImageIcon, Save,
} from "lucide-react";
import { fetchEventById, updateEvent } from "@/utils/api";
import { queryKeys } from "@/utils/queryKeys";

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const CATEGORIES = ["conference", "workshop", "meetup", "concert", "sports", "party"];

export default function DashboardEventEdit() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading, error } = useQuery({
    queryKey: queryKeys.events.byId(eventId!),
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-semibold text-red-400">{String(error ?? "Event tidak ditemukan")}</p>
          <Link to="/organizer/dashboard/events" className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-bold text-[#0a0a0a] no-underline">
            Kembali ke Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EditForm
      event={event}
      onSaved={() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.byId(event.id) });
        navigate("/organizer/dashboard/events");
      }}
    />
  );
}

function EditForm({
  event, onSaved,
}: {
  event: Awaited<ReturnType<typeof fetchEventById>>;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: event.name,
    description: event.description,
    category: event.category,
    location: event.location,
    venue: event.venue,
    startDate: toLocalDatetime(event.startDate),
    endDate: toLocalDatetime(event.endDate),
    imageUrl: event.imageUrl || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event.imageUrl || null);
  const [error, setError] = useState("");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const updateMutation = useMutation({
    mutationFn: (vars: { input: Parameters<typeof updateEvent>[1]; file?: File }) =>
      updateEvent(event.id, vars.input, vars.file),
    onSuccess: onSaved,
    onError: async (err: any) => {
      try {
        const body = await err.response?.json();
        setError(body?.message || "Gagal update event");
      } catch {
        setError("Gagal update event. Coba lagi.");
      }
    },
  });

  const handleSubmit = () => {
    if (!form.name || form.name.length < 3) { setError("Nama event minimal 3 karakter"); return; }
    if (!form.description || form.description.length < 10) { setError("Deskripsi minimal 10 karakter"); return; }
    if (!form.location || !form.venue) { setError("Lokasi dan venue wajib diisi"); return; }
    if (!form.startDate || !form.endDate) { setError("Tanggal mulai dan selesai wajib diisi"); return; }
    if (new Date(form.startDate) >= new Date(form.endDate)) { setError("Tanggal selesai harus setelah tanggal mulai"); return; }

    setError("");
    updateMutation.mutate({
      input: {
        name: form.name,
        description: form.description,
        category: form.category,
        location: form.location,
        venue: form.venue,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
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

      <h1 className="display-title text-2xl font-bold text-white sm:text-3xl">Edit Event</h1>
      <p className="mt-1 text-sm text-white/50">Update detail event kamu</p>

      <div className="mt-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-xs text-white/40">
        Ticket types tidak bisa diubah setelah event dibuat. Hubungi support kalau perlu perubahan.
      </div>

      <div className="mt-6 space-y-6">
        <section className="rounded-2xl border border-white/8 bg-white/4 p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">Info Dasar</h2>

          <div className="mt-4 space-y-4">
            <FormField label="Nama Event">
              <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="form-input" />
            </FormField>
            <FormField label="Kategori">
              <select value={form.category} onChange={(e) => updateField("category", e.target.value)} className="form-input">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Deskripsi">
              <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={5} className="form-input resize-none" />
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
              <input type="text" value={form.location} onChange={(e) => updateField("location", e.target.value)} className="form-input" />
            </FormField>
            <FormField label="Venue">
              <input type="text" value={form.venue} onChange={(e) => updateField("venue", e.target.value)} className="form-input" />
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
              <input type="datetime-local" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)} className="form-input" />
            </FormField>
            <FormField label="Selesai">
              <input type="datetime-local" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)} className="form-input" />
            </FormField>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link to="/organizer/dashboard/events" className="flex items-center justify-center rounded-xl border border-white/12 bg-white/4 px-5 py-3 text-sm font-semibold text-white/70 no-underline transition-all hover:bg-white/8 hover:text-white">
            Batal
          </Link>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0a0a0a] transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {updateMutation.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a]" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">{label}</label>
      {children}
    </div>
  );
}
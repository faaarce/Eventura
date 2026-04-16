export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // spasi jadi "-"
    .replace(/[^\w-]+/g, "") // hapus karakter aneh (selain huruf, angka, underscore, dash)
    .replace(/--+/g, "-") // multiple "-" jadi satu
    .replace(/^-+|-+$/g, ""); // hapus "-" di awal/akhir
}
 
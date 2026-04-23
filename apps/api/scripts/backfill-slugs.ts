// ============================================================
// BACKFILL SLUG SCRIPT — jalanin sekali doang
// ============================================================
//
// Simpen di: apps/api/scripts/backfill-slugs.ts
//
// Fungsi: generate slug buat event yang belum punya slug
// (event lama yang dibuat sebelum field slug ada).
//
// Jalanin:
//   cd apps/api
//   pnpm tsx scripts/backfill-slugs.ts
// ============================================================
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateSlug } from "../src/utils/generate-slug.js";
import dotenv from "dotenv";
import path from "path";

// load .env dari root project
dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

console.log("ENV DB:", process.env.DATABASE_URL);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Mulai backfill slug...\n");

  const events = await prisma.event.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  if (events.length === 0) {
    console.log("✅ Semua event udah punya slug. Nothing to do!");
    return;
  }

  console.log(`Ditemukan ${events.length} event tanpa slug\n`);

  let successCount = 0;
  let failCount = 0;

  for (const event of events) {
    try {
      const baseSlug = generateSlug(event.name);
      let slug = baseSlug;
      let counter = 1;

      // Cek uniqueness — kalau udah ada, tambahin counter
      while (await prisma.event.findFirst({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await prisma.event.update({
        where: { id: event.id },
        data: { slug },
      });

      console.log(`   ✓ ${event.name} → ${slug}`);
      successCount++;
    } catch (err) {
      console.error(`   ✗ Failed to backfill "${event.name}":`, err);
      failCount++;
    }
  }

  console.log(
    `\n✨ Selesai! ${successCount} sukses, ${failCount} gagal\n`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Backfill error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
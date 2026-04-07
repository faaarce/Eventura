
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function monthsFromNow(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  console.log("🌱 Mulai seeding...");

 
  console.log("🧹 Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.point.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();


  console.log("👤 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const organizer1 = await prisma.user.create({
    data: {
      name: "Devscale Indonesia",
      email: "organizer@devscale.id",
      password: hashedPassword,
      role: "ORGANIZER",
      referralCode: "DEVSCALE",
    },
  });

  const organizer2 = await prisma.user.create({
    data: {
      name: "Palembang Events Co",
      email: "organizer@palembang.id",
      password: hashedPassword,
      role: "ORGANIZER",
      referralCode: "PLMBNG01",
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Naila Zahira",
      email: "naila@example.com",
      password: hashedPassword,
      role: "CUSTOMER",
      referralCode: "NAILA001",
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi@example.com",
      password: hashedPassword,
      role: "CUSTOMER",
      referralCode: "BUDI0001",
      referredById: customer1.id, 
    },
  });

 
  await prisma.point.create({
    data: {
      userId: customer1.id,
      amount: 10000,
      expiresAt: monthsFromNow(3),
    },
  });


  await prisma.coupon.create({
    data: {
      code: "REF-WELCOME1",
      discountAmount: 50000,
      userId: customer2.id,
      expiresAt: monthsFromNow(3),
    },
  });

  console.log(`   ✅ 2 organizers, 2 customers`);

 
  console.log("🎪 Creating events...");

  const event1 = await prisma.event.create({
    data: {
      name: "Palembang Tech Conference 2026",
      description:
        "Konferensi teknologi terbesar di Sumatra Selatan. Pelajari tren terbaru di AI, cloud computing, dan web development dari para ahli industri. Networking, workshop, dan talks menarik menanti kamu!",
      category: "conference",
      location: "Palembang",
      venue: "Palembang Convention Center",
      startDate: daysFromNow(30),
      endDate: daysFromNow(30),
      isFree: false,
      organizerId: organizer1.id,
      ticketTypes: {
        create: [
          { name: "Early Bird", price: 75000, totalSeats: 100, availableSeats: 100 },
          { name: "Regular", price: 150000, totalSeats: 300, availableSeats: 300 },
          { name: "VIP", price: 500000, totalSeats: 30, availableSeats: 30 },
        ],
      },
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: "React Indonesia Meetup #42",
      description:
        "Meetup gratis komunitas React Indonesia. Topik kali ini: Server Components, TanStack Router, dan state management modern. Cocok untuk developer semua level!",
      category: "meetup",
      location: "Jakarta",
      venue: "CoHive Sudirman",
      startDate: daysFromNow(14),
      endDate: daysFromNow(14),
      isFree: true,
      organizerId: organizer1.id,
      ticketTypes: {
        create: [
          { name: "Free Entry", price: 0, totalSeats: 80, availableSeats: 80 },
        ],
      },
    },
  });

  const event3 = await prisma.event.create({
    data: {
      name: "UI/UX Design Workshop",
      description:
        "Workshop hands-on desain UI/UX untuk pemula. Kamu akan belajar Figma, design principles, dan bikin portfolio piece dalam 1 hari. Lunch included!",
      category: "workshop",
      location: "Palembang",
      venue: "Aula Universitas Sriwijaya",
      startDate: daysFromNow(21),
      endDate: daysFromNow(21),
      isFree: false,
      organizerId: organizer2.id,
      ticketTypes: {
        create: [
          { name: "Student", price: 50000, totalSeats: 30, availableSeats: 30 },
          { name: "Professional", price: 100000, totalSeats: 20, availableSeats: 20 },
        ],
      },
    },
  });

  const event4 = await prisma.event.create({
    data: {
      name: "Indie Music Night Vol. 8",
      description:
        "Malam apresiasi musik indie dari band-band lokal Palembang. Line-up kali ini menampilkan 6 band dengan genre beragam dari folk, rock, sampai electronic.",
      category: "concert",
      location: "Palembang",
      venue: "Graha Bumi Sriwijaya",
      startDate: daysFromNow(45),
      endDate: daysFromNow(45),
      isFree: false,
      organizerId: organizer2.id,
      ticketTypes: {
        create: [
          { name: "Presale", price: 50000, totalSeats: 100, availableSeats: 100 },
          { name: "On The Spot", price: 75000, totalSeats: 100, availableSeats: 100 },
        ],
      },
    },
  });

  const event5 = await prisma.event.create({
    data: {
      name: "Palembang Run Festival 10K",
      description:
        "Lari 10K mengelilingi landmark-landmark ikonik Palembang. Dapatkan medali finisher, jersey eksklusif, dan refreshment di finish line!",
      category: "sports",
      location: "Palembang",
      venue: "Benteng Kuto Besak",
      startDate: daysFromNow(60),
      endDate: daysFromNow(60),
      isFree: false,
      organizerId: organizer2.id,
      ticketTypes: {
        create: [
          { name: "Early Registration", price: 100000, totalSeats: 300, availableSeats: 300 },
          { name: "Regular", price: 150000, totalSeats: 200, availableSeats: 200 },
        ],
      },
    },
  });

  const event6 = await prisma.event.create({
    data: {
      name: "Startup Weekend Sumsel",
      description:
        "54 jam untuk bikin startup dari nol! Pitch ide kamu, bentuk tim, bangun MVP, dan presentasi ke investor. Hadiah total Rp 30 juta!",
      category: "conference",
      location: "Palembang",
      venue: "STMIK MDP Hall",
      startDate: daysFromNow(75),
      endDate: daysFromNow(77),
      isFree: false,
      organizerId: organizer1.id,
      ticketTypes: {
        create: [
          { name: "Participant", price: 200000, totalSeats: 120, availableSeats: 120 },
        ],
      },
    },
  });

  console.log(`   ✅ 6 events`);


  console.log("🎟️  Creating vouchers...");

  await prisma.voucher.create({
    data: {
      code: "EARLYBIRD50",
      discountAmount: 50000,
      startDate: daysFromNow(-1),
      endDate: daysFromNow(20),
      maxUsage: 50,
      eventId: event1.id,
    },
  });

  await prisma.voucher.create({
    data: {
      code: "TECH25",
      discountAmount: 25000,
      startDate: daysFromNow(-1),
      endDate: daysFromNow(25),
      maxUsage: 100,
      eventId: event1.id,
    },
  });

  await prisma.voucher.create({
    data: {
      code: "WORKSHOP10",
      discountAmount: 10000,
      startDate: daysFromNow(-1),
      endDate: daysFromNow(18),
      maxUsage: 30,
      eventId: event3.id,
    },
  });

  console.log(`   ✅ 3 vouchers`);

  console.log("\n✨ Seeding selesai!\n");
  console.log("📋 Login credentials (password: password123):");
  console.log("   Organizer 1: organizer@devscale.id");
  console.log("   Organizer 2: organizer@palembang.id");
  console.log("   Customer 1:  naila@example.com");
  console.log("   Customer 2:  budi@example.com");
  console.log("\n🎟️  Voucher codes untuk Palembang Tech Conference:");
  console.log("   EARLYBIRD50 (diskon Rp 50.000)");
  console.log("   TECH25      (diskon Rp 25.000)");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
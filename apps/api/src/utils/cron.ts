
import cron from "node-cron";
import { prisma } from "./prisma.js";
import { TransactionService } from "../services/transaction.service.js";

const transactionService = new TransactionService();

/**
 * Job 1: Auto-expire WAITING_FOR_PAYMENT transactions
 * Kalau user nggak upload bukti bayar dalam 2 jam, transaksi di-expire
 * dan semua resource (seats, points, voucher, coupon) di-rollback.
 *
 * Jalan setiap 5 menit.
 */
async function expireUnpaidTransactions() {
  const now = new Date();

  try {
    const expired = await prisma.transaction.findMany({
      where: {
        status: "WAITING_FOR_PAYMENT",
        paymentDeadline: { lt: now },
      },
      select: { id: true, invoiceNumber: true },
    });

    if (expired.length === 0) return;

    console.log(
      `[CRON] Found ${expired.length} unpaid transaction(s) to expire`
    );

    for (const trx of expired) {
      try {
        await transactionService.rollbackTransaction(trx.id, "EXPIRED");
        console.log(`   ✓ Expired ${trx.invoiceNumber}`);
      } catch (err) {
        console.error(`   ✗ Failed to expire ${trx.invoiceNumber}:`, err);
      }
    }
  } catch (err) {
    console.error("[CRON] expireUnpaidTransactions error:", err);
  }
}

/**
 * Job 2: Auto-cancel WAITING_FOR_CONFIRMATION transactions
 * Kalau organizer nggak accept/reject dalam 3 hari sejak dibuat,
 * transaksi otomatis di-cancel dan di-rollback.
 *
 * Jalan setiap 1 jam.
 */
async function cancelUnconfirmedTransactions() {
  const now = new Date();

  try {
    const unconfirmed = await prisma.transaction.findMany({
      where: {
        status: "WAITING_FOR_CONFIRMATION",
        expiresAt: { lt: now },
      },
      select: { id: true, invoiceNumber: true },
    });

    if (unconfirmed.length === 0) return;

    console.log(
      `[CRON] Found ${unconfirmed.length} unconfirmed transaction(s) to cancel`
    );

    for (const trx of unconfirmed) {
      try {
        await transactionService.rollbackTransaction(trx.id, "CANCELED");
        console.log(`   ✓ Canceled ${trx.invoiceNumber}`);
      } catch (err) {
        console.error(`   ✗ Failed to cancel ${trx.invoiceNumber}:`, err);
      }
    }
  } catch (err) {
    console.error("[CRON] cancelUnconfirmedTransactions error:", err);
  }
}

/**
 * Register semua cron jobs.
 * Panggil ini sekali pas server start up.
 */
export function startCronJobs() {
  // Setiap 5 menit: cek transaksi yang deadline pembayarannya lewat
  cron.schedule("*/5 * * * *", () => {
    expireUnpaidTransactions();
  });

  // Setiap 1 jam: cek transaksi yang organizer nggak konfirmasi
  cron.schedule("0 * * * *", () => {
    cancelUnconfirmedTransactions();
  });

  console.log("⏰ Cron jobs registered:");
  console.log("   - Expire unpaid transactions: every 5 minutes");
  console.log("   - Cancel unconfirmed transactions: every 1 hour");

  // Run sekali pas startup biar data yang udah expired sebelum server jalan
  // langsung kehandle
  expireUnpaidTransactions();
  cancelUnconfirmedTransactions();
}
import cron from "node-cron";
import { prisma } from "./prisma.js";
import { rollbackTransaction } from "../services/transaction.service.js";

async function expireUnpaidTransactions() {
  try {
    const expired = await prisma.transaction.findMany({
      where: { status: "WAITING_FOR_PAYMENT", paymentDeadline: { lt: new Date() } },
      select: { id: true, invoiceNumber: true },
    });
    if (!expired.length) return;

    console.log(`[CRON] Found ${expired.length} unpaid transaction(s) to expire`);
    for (const trx of expired) {
      try {
        await rollbackTransaction(trx.id, "EXPIRED");
        console.log(`   ✓ Expired ${trx.invoiceNumber}`);
      } catch (err) {
        console.error(`   ✗ Failed to expire ${trx.invoiceNumber}:`, err);
      }
    }
  } catch (err) {
    console.error("[CRON] expireUnpaidTransactions error:", err);
  }
}

async function cancelUnconfirmedTransactions() {
  try {
    const unconfirmed = await prisma.transaction.findMany({
      where: { status: "WAITING_FOR_CONFIRMATION", expiresAt: { lt: new Date() } },
      select: { id: true, invoiceNumber: true },
    });
    if (!unconfirmed.length) return;

    console.log(`[CRON] Found ${unconfirmed.length} unconfirmed transaction(s) to cancel`);
    for (const trx of unconfirmed) {
      try {
        await rollbackTransaction(trx.id, "CANCELED");
        console.log(`   ✓ Canceled ${trx.invoiceNumber}`);
      } catch (err) {
        console.error(`   ✗ Failed to cancel ${trx.invoiceNumber}:`, err);
      }
    }
  } catch (err) {
    console.error("[CRON] cancelUnconfirmedTransactions error:", err);
  }
}

export function startCronJobs() {
  cron.schedule("*/5 * * * *", expireUnpaidTransactions);
  cron.schedule("0 * * * *", cancelUnconfirmedTransactions);

  console.log("⏰ Cron jobs registered:");
  console.log("   - Expire unpaid transactions: every 5 minutes");
  console.log("   - Cancel unconfirmed transactions: every 1 hour");

  // Run once on startup
  expireUnpaidTransactions();
  cancelUnconfirmedTransactions();
}
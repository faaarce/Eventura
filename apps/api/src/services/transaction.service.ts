import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/helpers.js";

interface CreateTransactionInput {
  eventId: string;
  items: { ticketTypeId: string; quantity: number }[];
  voucherCode?: string;
  couponId?: string;
  usePoints?: boolean;
}

interface TransactionQuery {
  page?: string;
  limit?: string;
  status?: string;
}

const TRANSACTION_INCLUDE = {
  items: { include: { ticketType: true } },
  event: {
    select: { id: true, name: true, venue: true, location: true, startDate: true, endDate: true },
  },
  voucher: { select: { id: true, code: true, discountAmount: true } },
  coupon: { select: { id: true, code: true, discountAmount: true } },
} as const;

function generateInvoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${date}-${random}`;
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  return await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: input.eventId },
      include: { ticketTypes: true },
    });
    if (!event) throw new ApiError(404, "Event not found");
    if (new Date(event.endDate) < new Date()) throw new ApiError(400, "Event has already ended");
    if (!input.items.length) throw new ApiError(400, "At least one ticket type is required");

    let totalPrice = 0;
    for (const item of input.items) {
      const ticketType = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
      if (!ticketType) throw new ApiError(404, `Ticket type ${item.ticketTypeId} not found`);
      if (item.quantity < 1) throw new ApiError(400, "Quantity must be at least 1");
      if (ticketType.availableSeats < item.quantity) {
        throw new ApiError(400, `Not enough seats for ${ticketType.name}. Available: ${ticketType.availableSeats}`);
      }
      totalPrice += ticketType.price * item.quantity;
    }

    // Apply voucher
    let voucherDiscount = 0;
    let voucherId: string | undefined;
    if (input.voucherCode) {
      const voucher = await tx.voucher.findFirst({
        where: {
          code: input.voucherCode,
          eventId: input.eventId,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      });
      if (!voucher) throw new ApiError(400, "Invalid or expired voucher");
      if (voucher.usedCount >= voucher.maxUsage) throw new ApiError(400, "Voucher has reached max usage");
      voucherDiscount = voucher.discountAmount;
      voucherId = voucher.id;
      await tx.voucher.update({ where: { id: voucher.id }, data: { usedCount: { increment: 1 } } });
    }

    // Apply coupon
    let couponDiscount = 0;
    let couponId: string | undefined;
    if (input.couponId) {
      const coupon = await tx.coupon.findFirst({
        where: { id: input.couponId, userId, isUsed: false, expiresAt: { gte: new Date() } },
      });
      if (!coupon) throw new ApiError(400, "Invalid or expired coupon");
      couponDiscount = coupon.discountAmount;
      couponId = coupon.id;
      await tx.coupon.update({ where: { id: coupon.id }, data: { isUsed: true } });
    }

    // Apply points (FIFO)
    let pointsUsed = 0;
    if (input.usePoints) {
      const activePoints = await tx.point.findMany({
        where: { userId, isUsed: false, expiresAt: { gte: new Date() } },
        orderBy: { expiresAt: "asc" },
      });
      const remaining = Math.max(0, totalPrice - voucherDiscount - couponDiscount);
      for (const point of activePoints) {
        if (pointsUsed >= remaining) break;
        pointsUsed += Math.min(point.amount, remaining - pointsUsed);
        await tx.point.update({ where: { id: point.id }, data: { isUsed: true } });
      }
    }

    const finalPrice = Math.max(0, totalPrice - voucherDiscount - couponDiscount - pointsUsed);

    // Deduct seats
    for (const item of input.items) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { availableSeats: { decrement: item.quantity } },
      });
    }

    const now = new Date();
    return await tx.transaction.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        userId,
        eventId: input.eventId,
        totalPrice,
        finalPrice,
        pointsUsed,
        voucherId: voucherId || null,
        couponId: couponId || null,
        paymentDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        items: {
          create: input.items.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            pricePerUnit: event.ticketTypes.find((t) => t.id === item.ticketTypeId)!.price,
          })),
        },
      },
      include: TRANSACTION_INCLUDE,
    });
  });
}

export async function findAll(userId: string, query: TransactionQuery) {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { userId };
  if (query.status) where.status = query.status;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { id: true, name: true, venue: true, startDate: true } },
        items: { include: { ticketType: { select: { name: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function findById(transactionId: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      ...TRANSACTION_INCLUDE,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!transaction) throw new ApiError(404, "Transaction not found");

  if (transaction.userId !== userId) {
    const event = await prisma.event.findUnique({ where: { id: transaction.eventId } });
    if (!event || event.organizerId !== userId) {
      throw new ApiError(403, "Not authorized to view this transaction");
    }
  }

  return transaction;
}

export async function uploadPaymentProof(transactionId: string, userId: string, paymentProofUrl: string) {
  const trx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!trx) throw new ApiError(404, "Transaction not found");
  if (trx.userId !== userId) throw new ApiError(403, "Not your transaction");
  if (trx.status !== "WAITING_FOR_PAYMENT") throw new ApiError(400, "Transaction is not waiting for payment");
  if (new Date() > trx.paymentDeadline) throw new ApiError(400, "Payment deadline has passed");

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: { paymentProof: paymentProofUrl, status: "WAITING_FOR_CONFIRMATION" },
    include: TRANSACTION_INCLUDE,
  });
}

export async function acceptTransaction(transactionId: string, organizerId: string) {
  const trx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { event: true },
  });
  if (!trx) throw new ApiError(404, "Transaction not found");
  if (trx.event.organizerId !== organizerId) throw new ApiError(403, "Not your event");
  if (trx.status !== "WAITING_FOR_CONFIRMATION") throw new ApiError(400, "Transaction is not waiting for confirmation");

  return await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "DONE" },
    include: TRANSACTION_INCLUDE,
  });
}

export async function rejectTransaction(transactionId: string, organizerId: string) {
  const trx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { event: true },
  });
  if (!trx) throw new ApiError(404, "Transaction not found");
  if (trx.event.organizerId !== organizerId) throw new ApiError(403, "Not your event");
  if (trx.status !== "WAITING_FOR_CONFIRMATION") throw new ApiError(400, "Transaction is not waiting for confirmation");

  return await rollbackTransaction(transactionId, "REJECTED");
}

export async function cancelTransaction(transactionId: string, userId: string) {
  const trx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!trx) throw new ApiError(404, "Transaction not found");
  if (trx.userId !== userId) throw new ApiError(403, "Not your transaction");
  if (trx.status !== "WAITING_FOR_PAYMENT") throw new ApiError(400, "Can only cancel transactions waiting for payment");

  return await rollbackTransaction(transactionId, "CANCELED");
}

export async function rollbackTransaction(transactionId: string, newStatus: "REJECTED" | "EXPIRED" | "CANCELED") {
  return await prisma.$transaction(async (tx) => {
    const trx = await tx.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { items: true },
    });

    // Already in terminal state — return as-is
    if (["DONE", "REJECTED", "EXPIRED", "CANCELED"].includes(trx.status)) {
      return await tx.transaction.findUniqueOrThrow({
        where: { id: transactionId },
        include: TRANSACTION_INCLUDE,
      });
    }

    // Restore seats
    for (const item of trx.items) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { availableSeats: { increment: item.quantity } },
      });
    }

    // Restore points
    if (trx.pointsUsed > 0) {
      const usedPoints = await tx.point.findMany({
        where: { userId: trx.userId, isUsed: true },
        orderBy: { createdAt: "desc" },
      });
      let remaining = trx.pointsUsed;
      for (const point of usedPoints) {
        if (remaining <= 0) break;
        await tx.point.update({ where: { id: point.id }, data: { isUsed: false } });
        remaining -= point.amount;
      }
    }

    // Restore coupon
    if (trx.couponId) {
      await tx.coupon.update({ where: { id: trx.couponId }, data: { isUsed: false } });
    }

    // Restore voucher
    if (trx.voucherId) {
      await tx.voucher.update({ where: { id: trx.voucherId }, data: { usedCount: { decrement: 1 } } });
    }

    return await tx.transaction.update({
      where: { id: transactionId },
      data: { status: newStatus },
      include: TRANSACTION_INCLUDE,
    });
  });
}

export async function getOrganizerTransactions(organizerId: string, query: TransactionQuery) {
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "10");
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { event: { organizerId } };
  if (query.status) where.status = query.status;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, name: true } },
        items: { include: { ticketType: { select: { name: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
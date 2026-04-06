import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/helpers.js";

interface CreateTransactionInput {
  eventId: string;
  items: {
    ticketTypeId: string;
    quantity: number;
  }[];
  voucherCode?: string;
  couponId?: string;
  usePoints?: boolean;
}

interface TransactionQuery {
  page?: string;
  limit?: string;
  status?: string;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${date}-${random}`;
}

export class TransactionService {
  async create(userId: string, input: CreateTransactionInput) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate event exists and is upcoming
      const event = await tx.event.findUnique({
        where: { id: input.eventId },
        include: { ticketTypes: true },
      });
      if (!event) throw new ApiError(404, "Event not found");
      if (new Date(event.endDate) < new Date()) {
        throw new ApiError(400, "Event has already ended");
      }

      // 2. Validate items & check seat availability
      if (!input.items.length) {
        throw new ApiError(400, "At least one ticket type is required");
      }

      let totalPrice = 0;
      for (const item of input.items) {
        const ticketType = event.ticketTypes.find(
          (t) => t.id === item.ticketTypeId,
        );
        if (!ticketType)
          throw new ApiError(404, `Ticket type ${item.ticketTypeId} not found`);
        if (item.quantity < 1)
          throw new ApiError(400, "Quantity must be at least 1");
        if (ticketType.availableSeats < item.quantity) {
          throw new ApiError(
            400,
            `Not enough seats for ${ticketType.name}. Available: ${ticketType.availableSeats}`,
          );
        }
        totalPrice += ticketType.price * item.quantity;
      }

      // 3. Apply voucher (event-specific, organizer-created)
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
        if (voucher.usedCount >= voucher.maxUsage) {
          throw new ApiError(400, "Voucher has reached max usage");
        }
        voucherDiscount = voucher.discountAmount;
        voucherId = voucher.id;

        await tx.voucher.update({
          where: { id: voucher.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 4. Apply coupon (system referral reward, any event)
      let couponDiscount = 0;
      let couponId: string | undefined;
      if (input.couponId) {
        const coupon = await tx.coupon.findFirst({
          where: {
            id: input.couponId,
            userId,
            isUsed: false,
            expiresAt: { gte: new Date() },
          },
        });
        if (!coupon) throw new ApiError(400, "Invalid or expired coupon");
        couponDiscount = coupon.discountAmount;
        couponId = coupon.id;

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { isUsed: true },
        });
      }

      // 5. Apply points (FIFO — soonest expiring first)
      let pointsUsed = 0;
      if (input.usePoints) {
        const activePoints = await tx.point.findMany({
          where: {
            userId,
            isUsed: false,
            expiresAt: { gte: new Date() },
          },
          orderBy: { expiresAt: "asc" },
        });

        const remaining = Math.max(
          0,
          totalPrice - voucherDiscount - couponDiscount,
        );
        for (const point of activePoints) {
          if (pointsUsed >= remaining) break;
          const useAmount = Math.min(point.amount, remaining - pointsUsed);
          pointsUsed += useAmount;
          await tx.point.update({
            where: { id: point.id },
            data: { isUsed: true },
          });
        }
      }

      // 6. Calculate final price (min 0)
      const finalPrice = Math.max(
        0,
        totalPrice - voucherDiscount - couponDiscount - pointsUsed,
      );

      // 7. Deduct seats
      for (const item of input.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { availableSeats: { decrement: item.quantity } },
        });
      }

      // 8. Create transaction + items
      const now = new Date();
      const transaction = await tx.transaction.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          userId,
          eventId: input.eventId,
          totalPrice,
          finalPrice,
          pointsUsed,
          voucherId: voucherId || null,
          couponId: couponId || null,
          paymentDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000), // +2 hours
          expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
          items: {
            create: input.items.map((item) => ({
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
              pricePerUnit: event.ticketTypes.find(
                (t) => t.id === item.ticketTypeId,
              )!.price,
            })),
          },
        },
        include: {
          items: { include: { ticketType: true } },
          event: { select: { id: true, name: true } },
          voucher: { select: { id: true, code: true, discountAmount: true } },
          coupon: { select: { id: true, code: true, discountAmount: true } },
        },
      });

      return transaction;
    });
  }

  async findAll(userId: string, query: TransactionQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          event: {
            select: { id: true, name: true, venue: true, startDate: true },
          },
          items: { include: { ticketType: { select: { name: true } } } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            venue: true,
            location: true,
            startDate: true,
            endDate: true,
          },
        },
        items: { include: { ticketType: true } },
        voucher: { select: { id: true, code: true, discountAmount: true } },
        coupon: { select: { id: true, code: true, discountAmount: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!transaction) throw new ApiError(404, "Transaction not found");
    if (transaction.userId !== userId) {
      // Allow organizer to view transactions for their events
      const event = await prisma.event.findUnique({
        where: { id: transaction.eventId },
      });
      if (!event || event.organizerId !== userId) {
        throw new ApiError(403, "Not authorized to view this transaction");
      }
    }

    return transaction;
  }

  async uploadPaymentProof(
    transactionId: string,
    userId: string,
    paymentProofUrl: string,
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new ApiError(404, "Transaction not found");
    if (transaction.userId !== userId)
      throw new ApiError(403, "Not your transaction");
    if (transaction.status !== "WAITING_FOR_PAYMENT") {
      throw new ApiError(400, "Transaction is not waiting for payment");
    }
    if (new Date() > transaction.paymentDeadline) {
      throw new ApiError(400, "Payment deadline has passed");
    }

    return await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentProof: paymentProofUrl,
        status: "WAITING_FOR_CONFIRMATION",
      },
      include: {
        items: { include: { ticketType: true } },
        event: {
          select: {
            id: true,
            name: true,
            venue: true,
            location: true,
            startDate: true,
            endDate: true,
          },
        },
        voucher: { select: { id: true, code: true, discountAmount: true } },
        coupon: { select: { id: true, code: true, discountAmount: true } },
      },
    });
  }

  async acceptTransaction(transactionId: string, organizerId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { event: true },
    });
    if (!transaction) throw new ApiError(404, "Transaction not found");
    if (transaction.event.organizerId !== organizerId) {
      throw new ApiError(403, "Not your event");
    }
    if (transaction.status !== "WAITING_FOR_CONFIRMATION") {
      throw new ApiError(400, "Transaction is not waiting for confirmation");
    }

    return await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "DONE" },
      include: {
        items: { include: { ticketType: true } },
        event: {
          select: {
            id: true,
            name: true,
            venue: true,
            location: true,
            startDate: true,
            endDate: true,
          },
        },
        voucher: { select: { id: true, code: true, discountAmount: true } },
        coupon: { select: { id: true, code: true, discountAmount: true } },
      },
    });
  }

  async rejectTransaction(transactionId: string, organizerId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { event: true, items: true },
    });
    if (!transaction) throw new ApiError(404, "Transaction not found");
    if (transaction.event.organizerId !== organizerId) {
      throw new ApiError(403, "Not your event");
    }
    if (transaction.status !== "WAITING_FOR_CONFIRMATION") {
      throw new ApiError(400, "Transaction is not waiting for confirmation");
    }

    return await this.rollbackTransaction(transactionId, "REJECTED");
  }

  async cancelTransaction(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new ApiError(404, "Transaction not found");
    if (transaction.userId !== userId)
      throw new ApiError(403, "Not your transaction");
    if (transaction.status !== "WAITING_FOR_PAYMENT") {
      throw new ApiError(
        400,
        "Can only cancel transactions waiting for payment",
      );
    }

    return await this.rollbackTransaction(transactionId, "CANCELED");
  }

  async rollbackTransaction(
    transactionId: string,
    newStatus: "REJECTED" | "EXPIRED" | "CANCELED",
  ) {
    return await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.findUniqueOrThrow({
        where: { id: transactionId },
        include: { items: true },
      });

      // 1. Restore seats
      for (const item of trx.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { availableSeats: { increment: item.quantity } },
        });
      }

      // 2. Restore points
      if (trx.pointsUsed > 0) {
        const usedPoints = await tx.point.findMany({
          where: { userId: trx.userId, isUsed: true },
          orderBy: { createdAt: "desc" },
        });

        let remaining = trx.pointsUsed;
        for (const point of usedPoints) {
          if (remaining <= 0) break;
          await tx.point.update({
            where: { id: point.id },
            data: { isUsed: false },
          });
          remaining -= point.amount;
        }
      }

      // 3. Restore coupon
      if (trx.couponId) {
        await tx.coupon.update({
          where: { id: trx.couponId },
          data: { isUsed: false },
        });
      }

      // 4. Restore voucher usage count
      if (trx.voucherId) {
        await tx.voucher.update({
          where: { id: trx.voucherId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      // 5. Update status
      return await tx.transaction.update({
        where: { id: transactionId },
        data: { status: newStatus },
        include: {
          items: { include: { ticketType: true } },
          event: {
            select: {
              id: true,
              name: true,
              venue: true,
              location: true,
              startDate: true,
              endDate: true,
            },
          },
          voucher: { select: { id: true, code: true, discountAmount: true } },
          coupon: { select: { id: true, code: true, discountAmount: true } },
        },
      });
    });
  }

  // For organizer dashboard: list transactions for their events
  async getOrganizerTransactions(organizerId: string, query: TransactionQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      event: { organizerId },
    };
    if (query.status) {
      where.status = query.status;
    }

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

    return {
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

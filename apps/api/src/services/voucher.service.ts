import { prisma } from "../utils/prisma.js";
import { ApiError } from "../utils/helpers.js";

interface CreateVoucherInput {
  code: string;
  discountAmount: number;
  startDate: string;
  endDate: string;
  maxUsage: number;
}

export class VoucherService {
  async create(organizerId: string, eventId: string, input: CreateVoucherInput) {
    // Validate event ownership
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, "Event not found");
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, "You can only create vouchers for your own events");
    }

    // Check code uniqueness
    const existing = await prisma.voucher.findUnique({ where: { code: input.code } });
    if (existing) throw new ApiError(400, "Voucher code already exists");

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (startDate >= endDate) throw new ApiError(400, "End date must be after start date");

    return await prisma.voucher.create({
      data: {
        code: input.code.toUpperCase(),
        discountAmount: input.discountAmount,
        startDate,
        endDate,
        maxUsage: input.maxUsage,
        eventId,
      },
    });
  }

  async listByEvent(organizerId: string, eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiError(404, "Event not found");
    if (event.organizerId !== organizerId) {
      throw new ApiError(403, "You can only view vouchers for your own events");
    }

    return await prisma.voucher.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  }

  async verifyCode(eventId: string, code: string) {
    const voucher = await prisma.voucher.findFirst({
      where: {
        code: code.toUpperCase(),
        eventId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    if (!voucher) throw new ApiError(400, "Invalid or expired voucher code");
    if (voucher.usedCount >= voucher.maxUsage) {
      throw new ApiError(400, "Voucher has reached maximum usage");
    }

    return {
      valid: true,
      code: voucher.code,
      discountAmount: voucher.discountAmount,
      remainingUsage: voucher.maxUsage - voucher.usedCount,
    };
  }
}

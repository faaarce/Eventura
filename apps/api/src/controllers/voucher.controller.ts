import type { Request, Response, NextFunction } from "express";
import { VoucherService } from "../services/voucher.service.js";
import z from "zod";

const voucherService = new VoucherService();

const createVoucherSchema = z.object({
  code: z.string().min(3).max(20),
  discountAmount: z.number().int().min(1),
  startDate: z.string(),
  endDate: z.string(),
  maxUsage: z.number().int().min(1),
});

export class VoucherController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createVoucherSchema.parse(req.body);
      const result = await voucherService.create(req.user!.userId, req.params.eventId, data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await voucherService.listByEvent(req.user!.userId, req.params.eventId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await voucherService.verifyCode(req.params.eventId, req.params.code);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

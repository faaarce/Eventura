import type { Request, Response, NextFunction } from "express";
import { TransactionService } from "../services/transaction.service.js";
import z from "zod";

const transactionService = new TransactionService();

const createTransactionSchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "At least one ticket item is required"),
  voucherCode: z.string().optional(),
  couponId: z.string().uuid().optional(),
  usePoints: z.boolean().optional(),
});

export class TransactionController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTransactionSchema.parse(req.body);
      const result = await transactionService.create(req.user!.userId, data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.findAll(
        req.user!.userId,
        req.query as Record<string, string>
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async uploadPaymentProof(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentProof } = req.body;
      if (!paymentProof) {
        res.status(400).json({ success: false, message: "paymentProof URL is required" });
        return;
      }
      const result = await transactionService.uploadPaymentProof(
        req.params.id,
        req.user!.userId,
        paymentProof
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.cancelTransaction(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.acceptTransaction(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.rejectTransaction(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getOrganizerTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.getOrganizerTransactions(
        req.user!.userId,
        req.query as Record<string, string>
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

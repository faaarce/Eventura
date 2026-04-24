import type { Request, Response, NextFunction } from "express";
import * as transactionService from "../services/transaction.service.js";
import z from "zod";

const createTransactionSchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "At least one ticket item is required"),
  voucherCode: z.string().optional(),
  couponId: z.string().uuid().optional(),
  usePoints: z.boolean().optional(),
});

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createTransactionSchema.parse(req.body);
    const result = await transactionService.createTransaction(
      req.user!.userId,
      data,
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await transactionService.findAll(
      req.user!.userId,
      req.query as Record<string, string>,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function findById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await transactionService.findById(
      req.params.id as string,
      req.user!.userId,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function uploadPaymentProof(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const file = req.file;
    if (!file) {
      res
        .status(400)
        .json({
          success: false,
          message: "File bukti pembayaran wajib diupload",
        });
      return;
    }
    const result = await transactionService.uploadPaymentProof(
      req.params.id as string,
      req.user!.userId,
      file,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await transactionService.cancelTransaction(
      req.params.id as string,
      req.user!.userId,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await transactionService.acceptTransaction(
      req.params.id as string,
      req.user!.userId,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await transactionService.rejectTransaction(
      req.params.id as string,
      req.user!.userId,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getOrganizerTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await transactionService.getOrganizerTransactions(
      req.user!.userId,
      req.query as Record<string, string>,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

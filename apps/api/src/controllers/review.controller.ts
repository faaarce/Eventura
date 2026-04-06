import type { Request, Response, NextFunction } from "express";
import { ReviewService } from "../services/review.service.js";
import z from "zod";

const reviewService = new ReviewService();

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export class ReviewController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createReviewSchema.parse(req.body);
      const result = await reviewService.create(req.user!.userId, req.params.eventId, data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listByEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");
      const result = await reviewService.listByEvent(req.params.eventId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getOrganizerReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.getOrganizerReviews(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

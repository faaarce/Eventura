import type { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service.js";

const dashboardService = new DashboardService();

export class DashboardController {
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getStatistics(
        req.user!.userId,
        req.query as Record<string, string>
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getEvents(
        req.user!.userId,
        req.query as Record<string, string>
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getAttendees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getAttendees(
        req.user!.userId,
        req.params.eventId,
        req.query as Record<string, string>
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

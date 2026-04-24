import type { Request, Response, NextFunction } from "express";
import * as dashboardService from "../services/dashboard.service.js";

export async function getStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getStatistics(req.user!.userId, req.query as Record<string, string>);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getEvents(req.user!.userId, req.query as Record<string, string>);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getAttendees(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dashboardService.getAttendees(req.user!.userId, req.params.eventId as string, req.query as Record<string, string>);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
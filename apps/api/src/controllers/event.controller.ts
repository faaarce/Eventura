
import type { Request, Response, NextFunction } from "express";
import * as eventService from "../services/event.service.js";
import z from "zod";

const createEventSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(1),
  location: z.string().min(1),
  venue: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  isFree: z.boolean(),
  imageUrl: z.string().optional(),
  ticketTypes: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        totalSeats: z.number().min(1),
      }),
    )
    .min(1, "At least one ticket type is required"),
});

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = {
      ...req.body,
      isFree: req.body.isFree === "true" || req.body.isFree === true,
      ticketTypes:
        typeof req.body.ticketTypes === "string"
          ? JSON.parse(req.body.ticketTypes)
          : req.body.ticketTypes,
    };
    const data = createEventSchema.parse(body);
    const file = req.file;
    const result = await eventService.create(req.user!.userId, data, file);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await eventService.findAll(
      req.query as Record<string, string>,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// Find by UUID (internal use / backward compat)
export async function findById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await eventService.findById(req.params.id as string);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ← TAMBAH: Find by slug (public URL lookup)
export async function findBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await eventService.findBySlug(req.params.slug as string);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    const result = await eventService.update(
      req.params.id as string,
      req.user!.userId,
      req.body,
      file,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await eventService.remove(
      req.params.id as string,
      req.user!.userId,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMyEvents(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await eventService.getOrganizerEvents(
      req.user!.userId,
      req.query as Record<string, string>,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
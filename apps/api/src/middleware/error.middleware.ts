import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/helpers.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Error:", err.message);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle Zod validation errors (zod v4)
  if (err.constructor.name === "ZodError" && "issues" in err) {
    const zodErr = err as unknown as { issues: { path: (string | number)[]; message: string }[] };
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: zodErr.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

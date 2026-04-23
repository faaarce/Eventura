import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { eventRouter } from "./routes/event.routes.js";
import { reviewRouter } from "./routes/review.routes.js";
import { transactionRouter } from "./routes/transaction.routes.js";
import { voucherRouter } from "./routes/voucher.routes.js";
import { startCronJobs } from "./utils/cron.js";

const app = express();

// Middleware — HARUS di atas, sebelum routes
app.use(cors({
  origin: [
    "http://localhost:3000",
    process.env.BASE_URL || "http://localhost:3000",
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (_req, res) => {
  res.json({ success: true, message: "Eventura API is running" });
});
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/events/:eventId/vouchers", voucherRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/dashboard", dashboardRouter);

// Error handler — HARUS paling bawah, setelah semua routes
app.use(errorHandler);

// Start server — PALING AKHIR
app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
  startCronJobs();
});
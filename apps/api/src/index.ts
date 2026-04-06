import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes.js";
import { eventRouter } from "./routes/event.routes.js";
import { transactionRouter } from "./routes/transaction.routes.js";
import { voucherRouter } from "./routes/voucher.routes.js";
import { reviewRouter } from "./routes/review.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({ success: true, message: "Eventura API is running" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);
app.use("/api/events/:eventId/vouchers", voucherRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/dashboard", dashboardRouter);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});

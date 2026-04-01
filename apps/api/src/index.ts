import express from "express";
import cors from "cors";
import { prisma } from "./utils/prisma.js";
import { createUserSchema } from "./modules/users/schema.js";
import { authRouter } from "./routes/auth.routes.js";
import { eventRouter } from "./routes/event.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(new URL("../uploads", import.meta.url).pathname));


app.get("/", (_req, res) => {
  res.send("Hello Express!");
});

app.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json({ users });
});

app.post("/users", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const newUser = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: "default",
      role: "CUSTOMER",
      referralCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
    },
  });

  res.status(201).json({ user: newUser });
});


app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


app.use(errorHandler);

app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
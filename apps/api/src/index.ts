import express from "express";
import cors from "cors";
import { prisma } from "./utils/prisma.js";
import { createUserSchema } from "./modules/users/schema.js";

const app = express();

app.use(cors());
app.use(express.json());

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
    },
  });

  res.status(201).json({ user: newUser });
});

app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
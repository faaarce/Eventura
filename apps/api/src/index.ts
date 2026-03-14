import express from "express";
import cors from "cors";
import { prisma } from "./utils/prisma.js";

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

app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
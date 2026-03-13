import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello Express!");
});

app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
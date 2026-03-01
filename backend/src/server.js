import express from "express";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

import transactionsRoute from "./routes/transactionsRoute.js";
import chatRoute from "./routes/chatRoute.js";
import job from "./config/cron.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") job.start();

// middleware
app.use(rateLimiter);
app.use(express.json({ limit: "10mb" })); // Tăng giới hạn nhận JSON lên 10MB

// our custom simple middleware
// app.use((req, res, next) => {
//   console.log("Hey we hit a req, the method is", req.method);
//   next();
// });

const PORT = process.env.PORT || 5001;

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/transactions", transactionsRoute);
app.use("/api/chat", chatRoute);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is up and running on PORT:", PORT);
  });
});
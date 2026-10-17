
import express from "express";
import dotenv from "dotenv";
import connectDb from "./lib/db.js";
import User from "./model/user.model.js";
import Redis from "ioredis";
import { rateLimiter } from "./middleware/ratelimit.js";
import emailQueue from "./queue.js";

dotenv.config();

const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());

export const redis = new Redis(process.env.REDIS_URL);

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "hello from phase1 redis",
  });
});

app.post("/create", async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
  });

  await redis.del("user:all");
  // await sendEmail()
  await emailQueue.add("send-email",{email})

  return res.json(user);
});

app.get("/get", rateLimiter , async (req, res) => {
  const user = await User.find();
  return res.json(user);
});

app.get("/get-redis", async (req, res) => {
  const cached = await redis.get("user:all");

  if (cached) {
    const user = JSON.parse(cached);
    return res.json(user);
  }

  const user = await User.find({});

  await redis.set("user:all", JSON.stringify(user));

  return res.json(user);
});

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.set(`otp:${email}`, otp, "EX", 30);

  return res.json({ otp });
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const cached = await redis.get(`otp:${email}`);

  if (!cached) {
    return res.status(400).json({
      message: "OTP not found or has expired",
    });
  }

  if (cached != otp) {
    return res.status(400).json({
      message: "incorrect otp",
    });
  }
  await redis.del(`otp:${email}`)
  return res.json({
    message: "otp verified",
  });
});

app.listen(port, async () => {
  await connectDb();
  console.log(`server running on the port: ${port}`);
});

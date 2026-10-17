import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import sendEmail from "./lib/sendEmail.js";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "email",
  async (job) => {
    console.log("job started");
    await sendEmail(job.data.email);
    console.log("job completed");
  },
  { connection },
);

worker.on("failed", (job, error) => {
  console.error(`Email job ${job?.id ?? "unknown"} failed:`, error);
});

worker.on("error", (error) => {
  console.error("Email worker error:", error);
});
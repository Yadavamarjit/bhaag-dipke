import { createServerFn } from "@tanstack/react-start";
import { getMongoDb } from "./mongo";

export interface FeedbackData {
  feedback: string;
  name?: string;
  email?: string;
  distance?: number;
  coins?: number;
  device?: string;
}

export const submitFeedbackServerFn = createServerFn({ method: "POST" })
  .validator((d: FeedbackData) => d)
  .handler(async ({ data }) => {
    try {
      if (!data?.feedback || !data.feedback.trim()) {
        return { success: false, error: "Feedback message cannot be empty." };
      }
      const db = await getMongoDb();
      const doc = {
        name: data.name?.trim() || "Anonymous Runner",
        email: data.email?.trim() || "",
        feedback: data.feedback.trim(),
        game: "BhaagDipke",
        distance: Number(data.distance) || 0,
        coins: Number(data.coins) || 0,
        device: data.device || "",
        createdAt: new Date(),
      };
      const res = await db.collection("gamefeedbacks").insertOne(doc);
      return { success: true, id: res.insertedId.toString() };
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      return { success: false, error: err?.message || "Failed to submit" };
    }
  });

export interface VisitorData {
  userId?: string;
  referredBy?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: string;
  screenResolution?: string;
  referrer?: string;
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
}

export const recordVisitorServerFn = createServerFn({ method: "POST" })
  .validator((d: VisitorData) => d)
  .handler(async ({ data }) => {
    try {
      const db = await getMongoDb();
      await db.collection("gamevisitors").insertOne({
        ...data,
        game: "BhaagDipke",
        visitedAt: new Date(),
      });
      return { success: true };
    } catch (err) {
      console.error("Visitor record error:", err);
      return { success: false };
    }
  });

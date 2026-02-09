
import Razorpay from "razorpay";
import { Subscription } from "../shared/models/Subscription.model.js";
import { Business } from "../shared/models/Business.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export async function createProSubscription(business) {
  // 1️⃣ Create Razorpay subscription
  const sub = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PRO_PLAN_ID,
    total_count: 12 // 12 months
  });

  // 2️⃣ Save subscription locally
  const subscription = await Subscription.create({
    businessId: business._id,
    plan: "pro",
    status: "active",
    razorpaySubscriptionId: sub.id,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    )
  });

  return subscription;
}

function getRazorpay() {
  console.log("🔑 RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
  console.log("🔑 RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);
  console.log("📦 PRO PLAN ID:", process.env.RAZORPAY_PRO_PLAN_ID);

  if (!process.env.RAZORPAY_KEY_ID) {
    throw new Error("RAZORPAY_KEY_ID missing");
  }

  if (!process.env.RAZORPAY_PRO_PLAN_ID) {
    throw new Error("RAZORPAY_PRO_PLAN_ID missing");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

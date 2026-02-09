import crypto from "crypto";
import { Subscription } from "../shared/models/Subscription.model.js";
import { Business } from "../shared/models/Business.model.js";

export async function handleRazorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;
  const payload = req.body.payload;

  // 🔥 Payment success
  if (event === "invoice.paid") {
    const razorpaySubId =
      payload.subscription.entity.id;

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: razorpaySubId
    });

    if (subscription) {
      subscription.status = "active";
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
      await subscription.save();

      // 🔑 Upgrade business
      await Business.updateOne(
        { _id: subscription.businessId },
        { plan: subscription.plan }
      );
    }
  }

  // 🔥 Payment failed
  if (event === "invoice.payment_failed") {
    const razorpaySubId =
      payload.subscription.entity.id;

    await Subscription.updateOne(
      { razorpaySubscriptionId: razorpaySubId },
      { status: "past_due" }
    );
  }

  res.json({ ok: true });
}

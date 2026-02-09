import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      required: true
    },

    status: {
      type: String,
      enum: ["active", "past_due", "cancelled"],
      default: "active"
    },

    razorpaySubscriptionId: String,
    razorpayCustomerId: String,

    currentPeriodStart: Date,
    currentPeriodEnd: Date
  },
  { timestamps: true }
);

export const Subscription = mongoose.model(
  "Subscription",
  subscriptionSchema
);

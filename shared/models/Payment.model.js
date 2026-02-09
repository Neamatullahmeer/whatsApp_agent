import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business"
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription"
    },

    razorpayPaymentId: String,
    razorpayOrderId: String,
    razorpayInvoiceId: String,

    amount: Number,
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["paid", "failed", "refunded"]
    }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);

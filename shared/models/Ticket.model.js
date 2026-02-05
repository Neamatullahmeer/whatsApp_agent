import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    userPhone: {
      type: String,
      required: true
    },

    issue: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    }
  },
  { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);

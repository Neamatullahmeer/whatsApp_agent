import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
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

    service: {
      type: String,
      required: true
    },

    date: {
      type: String, // simple for now (e.g., "tomorrow", "2026-02-05")
      required: true
    },

    time: {
      type: String, // "11:00"
      required: true
    },

    status: {
      type: String,
      enum: ["requested", "confirmed", "cancelled"],
      default: "requested"
    }
  },
  {
    timestamps: true
  }
);

export const Appointment = mongoose.model(
  "Appointment",
  appointmentSchema
);

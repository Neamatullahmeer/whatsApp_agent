import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business"
    },

    userPhone: String,

    category: {
      type: String, // real_estate | crm
      required: true
    },

    data: Object, // budget, location, product, etc.

    stage: {
      type: String,
      enum: ["new", "contacted", "qualified", "closed"],
      default: "new"
    }
  },
  { timestamps: true }
);

export const Lead = mongoose.model("Lead", leadSchema);

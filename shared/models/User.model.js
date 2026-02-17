import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["owner", "admin", "agent"],
      default: "agent"
    },

    active: {
      type: Boolean,
      default: true
    },

    // 🚀 NEW: Skill Based Routing ke liye
    // Example: "Sales wala banda chahiye" -> department check hoga
    department: {
      type: String,
      enum: ["sales", "support","admin", "general", "tech"],
      default: "general"
    },

    // 🔄 NEW: Round Robin ke liye
    // Track karega ki last chat kab mili thi. 
    // Default 1970 rakha hai taaki naye agent ko sabse pehle chat mile.
    lastAssignedAt: {
      type: Date,
      default: new Date(0) 
    },

    // 🟢 NEW: Agent Availability
    // Agar agent chutti pe hai ya offline hai, to use chat assign nahi hogi
    isOnline: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// 🔐 Hash password (Fixed: No 'next' param)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// 🔑 Compare password
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// ⚡ Fast Login & Filtering
userSchema.index({ phone: 1, businessId: 1 }, { unique: true });
userSchema.index({ businessId: 1, department: 1, active: 1 }); // Routing Query Fast karega

export const User = mongoose.model("User", userSchema);


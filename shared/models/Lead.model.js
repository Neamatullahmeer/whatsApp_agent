import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true // ⚡ Search fast karne ke liye index zaroori hai
    },

    // 👤 User Identity
    userPhone: { 
      type: String, 
      required: true 
    },
    
    // 🆕 New: WhatsApp Name (Jo 'pushName' se milta hai)
    profileName: {
      type: String,
      default: "Unknown User"
    },

    // 🆕 New: Identification Flag
    // 'visitor': Jisne sirf Hi bola / Timepass
    // 'lead': Jisne inquiry form bhara / Interest dikhaya
    // 'customer': Jisne appointment li ya khareeda
    type: {
      type: String,
      enum: ["visitor", "lead", "customer"],
      default: "visitor", // Default 'visitor' rahega jab tak wo form na bhare
      index: true
    },

    // 🏷️ Categorization
    category: {
      type: String, // real_estate | crm
      default: "general" 
    },

    tags: [{ type: String }], // e.g., ['hot', 'vip', 'fake']

    // 📅 Appointment Tracking
    appointmentDate: { 
      type: Date, 
      default: null,
      index: true // Sorting ke liye fast hoga
    },

    // 📦 Flexible Data (Budget, Location, Notes, etc.)
    data: {
      type: Object,
      default: {}
    }, 

    // 🌍 Meta Info
    source: {
      type: String,
      default: "whatsapp_bot"
    },

    // 📊 Pipeline Stage (Leads ke liye)
    stage: {
      type: String,
      enum: ["new", "contacted", "qualified", "closed", "lost"],
      default: "new"
    },

    // 🕒 Last Interaction Time (Chat list ko sort karne ke liye)
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// ⚡ Compound Index: Ek Business mein ek Number ek hi baar save hoga
// Isse duplicate entries nahi banengi
leadSchema.index({ businessId: 1, userPhone: 1 }, { unique: true });

export const Lead = mongoose.model("Lead", leadSchema);
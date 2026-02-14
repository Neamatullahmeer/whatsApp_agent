import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    /* ─────────────────────────────
       🔑 WHATSAPP IDENTITY (SYSTEM)
    ───────────────────────────── */
    phoneNumberId: {
      type: String,
      required: true,
      unique: true,
      index: true // ⚡ Faster Lookup for incoming webhooks
    },

    /* ─────────────────────────────
       🏢 BUSINESS PROFILE (FRONTEND)
    ───────────────────────────── */
    profile: {
      name: {
        type: String,
        required: true
      },

      // Frontend display category (Sirf dikhane ke liye)
      category: {
        type: String,
        enum: ["clinic", "salon", "service", "real_estate", "agency", "retail", "other"], 
        default: "service"
      },

      description: String, // Business ka short bio

      language: {
        type: String,
        enum: ["hinglish", "english", "hindi"],
        default: "hinglish"
      },
      
      logoUrl: String // Business ka logo (Optional)
    },

    /* ─────────────────────────────
       🧩 CATEGORY SYSTEM (ENGINE LOGIC)
    ───────────────────────────── */
    categoryType: {
      type: String,
      // 🔥 Logic Engine: Decide karega ki AdTech features on honge ya Real Estate ke
      enum: ["appointment", "real_estate", "crm", "support", "adtech", "healthcare"], 
      default: "appointment"
    },

    /* ─────────────────────────────
       👤 OWNER / ADMIN DETAILS
    ───────────────────────────── */
    owner: {
      name: String,
      phone: String,
      email: String
    },

    /* ─────────────────────────────
       🕒 AVAILABILITY & HOURS
    ───────────────────────────── */
    availability: {
      workingDays: {
        type: [String],
        default: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      },
      workingHours: {
        start: { type: String, default: "10:00" },
        end: { type: String, default: "20:00" }
      }
    },

    /* ─────────────────────────────────────────────────────────────
       🛍️ SERVICES & PRODUCTS (ADVANCED) 🚀
       Ab AI yahan se Image aur Details utha kar customer ko bhejega.
    ───────────────────────────────────────────────────────────── */
    services: [
      {
        // 1. Basic Info
        name: { type: String, required: true }, // e.g., "Luxury 3BHK Apartment"
        
        // 2. Pricing (Flexible)
        price: { type: String, default: "Contact for Price" }, // e.g., "1.5 Cr" or "$50"
        
        // 3. AI Pitching Content 🧠
        description: { 
           type: String, 
           default: "Premium quality service." 
        }, // AI ye line use karega features batane ke liye
        
        // 4. 📷 PRODUCT IMAGE (URL)
        // Cloudinary/S3 link yahan aayega. 
        imageUrl: { 
          type: String, 
          default: "" // Empty string matlab no image
        },

        // 5. Categorization (Internal)
        // Example: Real Estate me "Rent/Sale", Clinic me "Consultation/Surgery"
        category: { type: String, default: "general" },

        // 6. Inventory Control
        isActive: { type: Boolean, default: true }, // Out of stock hai to False kar do

        // 7. Extra Metadata (Optional)
        duration: String // "30 min" (Sirf appointments ke liye)
      }
    ],

    /* ─────────────────────────────
       🤖 AGENT CONFIG (CORE BRAIN)
    ───────────────────────────── */
    agentConfig: {
      // Intents dynamically 'categoryResolver' se aayenge, par yahan store honge
      enabledIntents: {
        type: [String],
        default: [] 
      },

      // Feature Toggles
      actionsEnabled: {
        create_appointment: { type: Boolean, default: true },
        create_lead: { type: Boolean, default: true },
        escalate_to_human: { type: Boolean, default: true }
      },

      // Business Rules
      rules: {
        sundayClosed: { type: Boolean, default: true }
      },

      // Custom AI Responses
      responses: {
        greeting: {
          type: String,
          default: "Hello! 👋 How can we help you grow today?"
        },
        lowConfidence: {
          type: String,
          default: "Maaf kijiye, main samajh nahi paya. Thoda detail mein batayenge? 🤔"
        }
      }
    },

    /* ─────────────────────────────
       📊 SAAS PLAN & SUBSCRIPTION
    ───────────────────────────── */
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free"
    },

    status: {
      type: String,
      enum: ["draft", "active", "paused"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

// ⚡ Compound Indexes for Speed
businessSchema.index({ phoneNumberId: 1, status: 1 });

export const Business =
  mongoose.models.Business ||
  mongoose.model("Business", businessSchema);
import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    /* ─────────────────────────────
       🔑 WHATSAPP IDENTITY (SYSTEM)
    ───────────────────────────── */
    phoneNumberId: {
      type: String,
      required: true,
      unique: true
    },

    /* ─────────────────────────────
       🏢 BUSINESS PROFILE (FRONTEND)
    ───────────────────────────── */
    profile: {
      name: {
        type: String,
        required: true
      },

      category: {
        type: String,
        enum: ["clinic", "salon", "service", "real_estate", "other"],
        default: "clinic"
      },

      description: String,

      language: {
        type: String,
        enum: ["hinglish", "english", "hindi"],
        default: "hinglish"
      }
    },

    /* ─────────────────────────────
       🧩 CATEGORY SYSTEM (ENGINE)
    ───────────────────────────── */
    categoryType: {
      type: String,
      enum: ["appointment", "real_estate", "crm", "support"],
      default: "appointment"
    },

    /* ─────────────────────────────
       👤 OWNER / ADMIN
    ───────────────────────────── */
    owner: {
      name: String,
      phone: String
    },

    /* ─────────────────────────────
       🕒 AVAILABILITY & HOURS
    ───────────────────────────── */
    availability: {
      workingDays: {
        type: [String],
        default: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday"
        ]
      },

      workingHours: {
        start: { type: String, default: "10:00" },
        end: { type: String, default: "20:00" }
      }
    },

    /* ─────────────────────────────
       🧾 SERVICES (APPOINTMENT USE)
    ───────────────────────────── */
    services: [
      {
        name: String,
        price: String,     // "500" | "depends"
        duration: String   // "30 min"
      }
    ],

    /* ─────────────────────────────
       🤖 AGENT CONFIG (CORE BRAIN)
    ───────────────────────────── */
    agentConfig: {
      enabledIntents: {
        type: [String],
        default: [
          "greeting",
          "ask_services",
          "ask_price",
          "ask_hours",
          "book_appointment"
        ]
      },

      actionsEnabled: {
        create_appointment: { type: Boolean, default: true }
      },

      rules: {
        sundayClosed: { type: Boolean, default: true }
      },

      responses: {
        greeting: {
          type: String,
          default: "Hello! 👋 Aap kaise madad chahte hain?"
        },
        lowConfidence: {
          type: String,
          default:
            "Mujhe thoda confusion ho raha hai. Kripya detail me batayein 🙂"
        }
      }
    },

    /* ─────────────────────────────
       📊 SAAS PLAN & STATUS
    ───────────────────────────── */
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free"
    },

    status: {
      type: String,
      enum: ["draft", "active", "paused"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);


export const Business =
  mongoose.models.Business ||
  mongoose.model("Business", businessSchema);

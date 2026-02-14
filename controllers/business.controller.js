import { resolveCategory } from "../services/categoryResolver.service.js"; 
import { Business } from "../shared/models/Business.model.js";

export const onboardBusiness = async (req, res) => {
  try {
    // 🔑 Injected by auth / whatsapp middleware
    const phoneNumberId = req.businessPhoneNumberId;

    if (!phoneNumberId) {
      return res.status(400).json({
        success: false,
        message: "phoneNumberId missing"
      });
    }

    const {
      profile = {},
      owner = {},
      availability = {},
      services = [],
      features = {},
      categoryType = "other" // Default to 'other' if not provided
    } = req.body;

    // 1️⃣ Find or Create Business
    let business = await Business.findOne({ phoneNumberId });

    if (!business) {
      business = new Business({ phoneNumberId });
    }

    // 2️⃣ Save Category Type (Engine ke liye zaroori)
    business.categoryType = categoryType;

    /* 🧠 BASIC PROFILE */
    if (profile) {
      business.profile = {
        ...business.profile,
        name: profile.name || business.profile?.name,
        category: profile.category || business.profile?.category,
        description: profile.description,
        language: profile.language || "hinglish",
        logoUrl: profile.logoUrl || business.profile?.logoUrl // 🖼️ Logo support added
      };
    }

    if (owner) business.owner = owner;

    /* ─────────────────────────────────────────────────────────────
       🧾 SERVICES MAPPING (UPDATED 🚀)
       Ab Image URL, Description aur Status bhi save hoga.
    ───────────────────────────────────────────────────────────── */
    if (Array.isArray(services)) {
      business.services = services.map(s => ({
        name: s.name,
        price: s.price,
        duration: s.duration,
        
        // 🧠 AI Description (Fallback to name if empty)
        description: s.description || `${s.name} service available.`,
        
        // 📷 Product Image (Critical for Rich Media)
        imageUrl: s.imageUrl || "",

        // 🏷️ Internal Category (e.g. 'Rent' vs 'Sale')
        category: s.category || "general",

        // 🟢 Stock Status
        isActive: s.isActive !== false // Default true unless explicitly false
      }));
    }

    /* 🕒 AVAILABILITY */
    if (availability) {
      business.availability = {
        workingDays: availability.workingDays || business.availability?.workingDays,
        workingHours: availability.workingHours || business.availability?.workingHours
      };
    }

    /* ─────────────────────────────────────────────────────────────
       🤖 AGENT CONFIG (DYNAMIC RESOLUTION)
    ───────────────────────────────────────────────────────────── */
    
    // 1. Feature Toggle check (Frontend se)
    const isAutoReplyEnabled = features.autoReplies !== false; // Default true

    // 2. Default Intents nikalo category ke hisaab se
    const categoryConfig = resolveCategory({ categoryType });
    
    // 3. Merge Logic
    const finalIntents = isAutoReplyEnabled 
      ? categoryConfig.enabledIntents 
      : ["greeting"];

    business.agentConfig = {
      enabledIntents: finalIntents,

      actionsEnabled: {
        create_appointment: Boolean(features.appointmentBooking),
        create_lead: true,        
        escalate_to_human: true   
      },

      rules: {
        sundayClosed: Boolean(availability.sundayClosed)
      },
      
      // Preserve custom responses if they exist
      responses: business.agentConfig?.responses || {}
    };

    /* 📊 STATUS */
    if (business.status === "draft") {
       business.status = "active"; 
    }

    await business.save();

    return res.json({
      success: true,
      message: "Business profile saved & AI Configured successfully",
      businessId: business._id,
      categoryType: business.categoryType,
      activeIntents: finalIntents.length,
      status: business.status
    });

  } catch (err) {
    console.error("❌ Business onboard error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to onboard business"
    });
  }
};

export const getMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({
      phoneNumberId: req.businessPhoneNumberId
    });

    if (!business) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      _id: business._id,
      phoneNumberId: business.phoneNumberId,
      
      profile: business.profile,
      categoryType: business.categoryType, 
      owner: business.owner,
      
      availability: {
        ...business.availability,
        sundayClosed: business.agentConfig?.rules?.sundayClosed
      },
      
      // ✅ Services ab full details ke saath jayengi
      services: business.services,
      
      features: {
        appointmentBooking: business.agentConfig?.actionsEnabled?.create_appointment,
        autoReplies: business.agentConfig?.enabledIntents?.length > 1
      },
      
      status: business.status,
      plan: business.plan
    });
  } catch (error) {
    console.error("Get Business Error:", error);
    res.status(500).json({ success: false, message: "Error fetching profile" });
  }
};

export const updateBusinessStatus = async (req, res) => {
  const { status } = req.body;

  if (!["draft", "active", "paused"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
  }

  await Business.updateOne(
    { phoneNumberId: req.businessPhoneNumberId },
    { status }
  );

  res.json({ success: true, status });
};
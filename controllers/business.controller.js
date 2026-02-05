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
      features = {}
    } = req.body;

    let business = await Business.findOne({ phoneNumberId });

    if (!business) {
      business = new Business({ phoneNumberId });
    }

    /* 🧠 BASIC PROFILE */
    if (profile) {
      business.profile = {
        ...business.profile,
        ...profile
      };
    }

    if (owner) {
      business.owner = owner;
    }

    if (Array.isArray(services)) {
      business.services = services;
    }

    /* 🕒 AVAILABILITY (merge-safe) */
    business.availability = {
      workingDays:
        availability.workingDays || business.availability?.workingDays,
      workingHours:
        availability.workingHours || business.availability?.workingHours
    };

    /* 🤖 AGENT CONFIG (FEATURE → POLICY MAPPING) */
    business.agentConfig = {
      enabledIntents: features.autoReplies
        ? [
            "greeting",
            "ask_services",
            "ask_price",
            "ask_hours",
            "book_appointment"
          ]
        : ["greeting"],

      actionsEnabled: {
        create_appointment: Boolean(features.appointmentBooking)
      },

      rules: {
        sundayClosed: Boolean(availability.sundayClosed)
      }
    };

    /* 📊 STATUS */
    business.status = "draft"; // activate after verification/payment

    await business.save();

    return res.json({
      success: true,
      message: "Business profile saved successfully",
      businessId: business._id,
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
  const business = await Business.findOne({
    phoneNumberId: req.businessPhoneNumberId
  });

  console.log("DEBUG phoneNumberId:", req.businessPhoneNumberId);


  if (!business) {
    return res.json({ exists: false });
  }

  return res.json({
    exists: true,
    profile: business.profile,
    owner: business.owner,
    availability: {
      ...business.availability,
      sundayClosed: business.agentConfig.rules.sundayClosed
    },
    services: business.services,
    features: {
      appointmentBooking:
        business.agentConfig.actionsEnabled.create_appointment,
      autoReplies:
        business.agentConfig.enabledIntents.length > 1
    },
    status: business.status,
    plan: business.plan
  });
};


export const updateBusinessStatus = async (req, res) => {
  const { status } = req.body;

  await Business.updateOne(
    { phoneNumberId: req.businessPhoneNumberId },
    { status }
  );

  res.json({ success: true, status });
};

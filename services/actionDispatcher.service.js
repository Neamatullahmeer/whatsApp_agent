import { ACTIONS } from "../constants/actionTypes.js";
import { createAppointment } from "./appointment.service.js";
import { createLead } from "./lead.service.js";
import { scheduleSiteVisit } from "./siteVisit.service.js";
import { requestCallback } from "./callback.service.js";
import { createTicket } from "./ticket.service.js";

// 👇 NEW IMPORTS (Traffic Police Logic ke liye 🚦)
import { findBestAgent } from "./autoAssignment.service.js";
import { assignConversation } from "./assignment.service.js";
// import { escalateToHuman } from "./handoff.service.js"; // 👈 Ab iski zarurat nahi hai, hum yahi handle karenge

export async function dispatchAction(actionResult, meta) {
  const { action, payload = {} } = actionResult;

  // ✅ Explicit no-op
  if (!action || action === ACTIONS.NONE) {
    return { success: true, data: null };
  }

  try {
    console.log("⚙️ [ACTION DISPATCH]", {
      action,
      businessId: meta?.businessId,
      user: meta?.userPhone
    });

    let result = null;

    switch (action) {
      case ACTIONS.CREATE_APPOINTMENT:
        result = await createAppointment(payload, meta);
        break;

      case ACTIONS.CREATE_LEAD:
        result = await createLead(payload, meta);
        break;

      case ACTIONS.SCHEDULE_SITE_VISIT:
        result = await scheduleSiteVisit(payload, meta);
        break;

      case ACTIONS.REQUEST_CALLBACK:
        result = await requestCallback(payload, meta);
        break;

      case ACTIONS.CREATE_TICKET:
        result = await createTicket(payload, meta);
        break;

      /* ──────────────────────────────────────────
         🚦 SMART ROUTING (SALES vs SUPPORT)
      ────────────────────────────────────────── */
      case ACTIONS.ESCALATE_TO_HUMAN:
        const { businessId, conversationId } = meta;
        // Agent Service se department aaya hoga ('sales' ya 'support')
        const targetDept = payload.department || "general";

        console.log(`🔍 Finding Best Agent for Department: ${targetDept}`);

        // 1️⃣ Skill Based Search: Specific department ka banda dhundo
        let bestAgent = await findBestAgent({
            businessId,
            strategy: "SKILL_BASED",
            requiredSkill: targetDept
        });

        // 2️⃣ Fallback: Agar Support ka koi banda online nahi hai, toh Round Robin se kisi ko bhi do
        if (!bestAgent) {
             console.log(`⚠️ No agent found in ${targetDept}. Falling back to Round Robin.`);
             bestAgent = await findBestAgent({ 
                businessId, 
                strategy: "ROUND_ROBIN" 
             });
        }

        if (bestAgent) {
             // 3️⃣ Assign the Chat
             await assignConversation({
                conversationId,
                userId: bestAgent._id,
                assignedBy: "system_ai",
                businessId
             });
             
             console.log(`✅ Chat Assigned to: ${bestAgent.name} (${targetDept || "Fallback"})`);
             
             result = { 
               status: "assigned", 
               agent: bestAgent.name, 
               department: targetDept 
             };
        } else {
             // ❌ Sab Offline hain
             console.log("❌ No agents available online.");
             result = { status: "queued", message: "No agents available" };
             // Optional: Yahan aap ticket create kar sakte ho fallback mein
        }
        break;

      default:
        console.warn("⚠️ Unknown action ignored:", action);
        return { success: false, error: "UNKNOWN_ACTION" };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("❌ Action execution failed:", {
      action,
      error: error.message
    });

    // ❌ DO NOT throw — agent flow must survive
    return {
      success: false,
      error: error.message || "ACTION_FAILED"
    };
  }
}
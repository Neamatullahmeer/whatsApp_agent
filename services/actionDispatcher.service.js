import { ACTIONS } from "../constants/actionTypes.js";
import { createAppointment } from "./appointment.service.js";
import { createLead } from "./lead.service.js";
import { scheduleSiteVisit } from "./siteVisit.service.js";
import { requestCallback } from "./callback.service.js";
import { createTicket } from "./ticket.service.js";
import { escalateToHuman } from "./handoff.service.js";

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

      case ACTIONS.ESCALATE_TO_HUMAN:
        result = await escalateToHuman(payload, meta);
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

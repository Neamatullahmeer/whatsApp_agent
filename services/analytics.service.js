import { Conversation } from "../shared/models/Conversation.model.js";
import { Message } from "../shared/models/Message.model.js";
import { Appointment } from "../shared/models/Appointment.model.js";
import { Lead } from "../shared/models/Lead.model.js";
import { Ticket } from "../shared/models/Ticket.model.js";

export async function getAnalytics({ businessId, categoryType }) {
  const baseFilter = { businessId };

  const conversations = await Conversation.countDocuments(baseFilter);
  const active = await Conversation.countDocuments({ ...baseFilter, status: "active" });
  const human = await Conversation.countDocuments({ ...baseFilter, status: "human" });

  const messagesIn = await Message.countDocuments({ ...baseFilter, from: "user" });
  const messagesOut = await Message.countDocuments({ ...baseFilter, from: "agent" });

  const result = {
    conversations,
    active,
    human,
    messagesIn,
    messagesOut
  };

  if (categoryType === "appointment") {
    result.appointments = await Appointment.countDocuments(baseFilter);
  }

  if (["real_estate", "crm"].includes(categoryType)) {
    result.leads = await Lead.countDocuments(baseFilter);
  }

  if (categoryType === "support") {
    result.tickets = await Ticket.countDocuments(baseFilter);
  }

  return result;
}

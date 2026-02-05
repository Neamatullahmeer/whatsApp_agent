import { Ticket } from "../shared/models/Ticket.model.js";

export async function createTicket(payload, meta) {
  const ticket = await Ticket.create({
    businessId: meta.businessId,
    userPhone: meta.userPhone,
    issue: payload.issue
  });

  return ticket;
}

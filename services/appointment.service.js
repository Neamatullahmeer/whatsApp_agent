import { notifyOwnerOnAppointment } from "./notification.service.js";
import { Business } from "../shared/models/Business.model.js";
import { Appointment } from "../shared/models/Appointment.model.js";

export async function createAppointment(payload, meta) {
  const { service, date, time } = payload;
  const { businessId, userPhone } = meta;

  // 🛑 DUPLICATE CHECK (last 24 hours)
  const existing = await Appointment.findOne({
    businessId,
    userPhone,
    service,
    date,
    time,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  if (existing) {
    console.log("⚠️ Duplicate appointment blocked");
    return {
      duplicate: true,
      appointment: existing
    };
  }

  const appointment = await Appointment.create({
    businessId,
    userPhone,
    service,
    date,
    time
  });

  return {
    duplicate: false,
    appointment
  };
}
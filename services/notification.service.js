import { sendTextMessage } from "./whatsapp.service.js";

export async function notifyOwnerOnAppointment({
  ownerPhone,
  businessName,
  service,
  date,
  time,
  userPhone
}) {
  if (!ownerPhone) {
    console.log("⚠️ Owner phone not set, skipping notification");
    return;
  }

  const message = `
📅 *New Appointment Request*

Business: ${businessName}
Service: ${service}
Date: ${date}
Time: ${time}
Customer: ${userPhone}
`;
console.log("owner message:", message)

 await sendTextMessage(ownerPhone, message);
}

console.log("JOB TOKEN EXISTS:", !!process.env.WHATSAPP_TOKEN);
console.log("JOB PHONE ID:", process.env.WHATSAPP_PHONE_NUMBER_ID);

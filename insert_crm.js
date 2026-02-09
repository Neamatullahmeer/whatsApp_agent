import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const businessSchema = new mongoose.Schema({}, { strict: false });
const Business = mongoose.model("Business", businessSchema);

async function addProductKnowledge() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("🔌 Connected");

  await Business.updateOne(
    { phoneNumberId: "CRM_001" },
    {
      $set: {
        services: [
          {
            name: "WhatsApp Automation",
            price: "1500 INR/Month",
            description: "24/7 Auto-reply, Bulk Broadcasting (10k/day), Button Messages, aur Chatbot Integration bina number block hue."
          },
          {
            name: "CRM Integration",
            price: "5000 INR",
            description: "Aapke leads automatically Google Sheets ya Excel mein save honge. Koi lead miss nahi hogi."
          },
          {
            name: "Email Marketing",
            price: "3000 INR",
            description: "Personalized Drip Campaigns, Open tracking aur professional templates setup."
          }
        ]
      }
    }
  );

  console.log("✅ Product Knowledge Added!");
  process.exit();
}

addProductKnowledge();
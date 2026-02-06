/*import dotenv from "dotenv";
dotenv.config();*/

console.log("🚀 ENTRY ENV CHECK:", {
  OPENAI: !!process.env.OPENAI_API_KEY,
  WHATSAPP: !!process.env.WHATSAPP_TOKEN
});

import app from "./app.js";
import connectDB from "./shared/db.js";
import test from "./test.js";
//import "./workers/message.worker.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // 1️⃣ DB connect
    await connectDB();

    // 2️⃣ optional test / seed
   // await test();

    // 3️⃣ server start
    app.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
    });

  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
}

// 🔥 THIS WAS MISSING
start();



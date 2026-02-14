import cron from "node-cron";
import { SequenceTracker } from "../shared/models/SequenceTracker.model.js";
import { Campaign } from "../shared/models/Campaign.model.js";
import { messageQueue } from "../queues/message.queue.js";

export const startSequenceScheduler = () => {
  console.log("⏳ Sequence Scheduler Started (Checking every minute)...");

  // Run every minute (* * * * *)
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // 1. Find users due for a message
      const dueTrackers = await SequenceTracker.find({
        status: "active",
        nextRunAt: { $lte: now } // Jo time beet gaya ya abhi hai
      }).limit(500); // Batch limit taaki server load na le

      if (dueTrackers.length === 0) return;

      console.log(`⚡ Processing ${dueTrackers.length} auto-sequence messages...`);

      for (const tracker of dueTrackers) {
        // Campaign Load karo taaki message content mile
        const campaign = await Campaign.findById(tracker.campaignId);
        
        if (!campaign || campaign.status !== "active") {
          // Agar campaign delete/pause ho gaya, to tracker ko pause karo
          tracker.status = "paused";
          await tracker.save();
          continue;
        }

        // Current Step ka Content nikalo
        const stepData = campaign.sequenceSteps.find(s => s.stepId === tracker.currentStep);

        if (stepData) {
          // 📨 QUEUE MEIN JOB DAALO (Message Bhejo)
          await messageQueue.add("send_campaign_msg", {
             campaignId: campaign._id,
             businessId: campaign.businessId,
             to: tracker.userPhone,
             msgBody: stepData.message, // Ya Template Logic
             media: stepData.media,
             trackerId: tracker._id // Taaki worker ko pata ho ye sequence hai
          });

          // 🔄 NEXT STEP UPDATE KARO
          const nextStepId = tracker.currentStep + 1;
          const nextStepData = campaign.sequenceSteps.find(s => s.stepId === nextStepId);

          if (nextStepData) {
             // Agla message kab bhejna hai? (Current time + Delay)
             // Example: Delay '2d' (2 days) ya '30m' (30 mins)
             const delayMs = parseDelay(nextStepData.delay); 
             
             tracker.currentStep = nextStepId;
             tracker.nextRunAt = new Date(Date.now() + delayMs);
             await tracker.save();
          } else {
             // Sequence Khatam 🎉
             tracker.status = "completed";
             tracker.completedAt = new Date();
             await tracker.save();
          }

        } else {
           // Step missing? Mark completed.
           tracker.status = "completed";
           await tracker.save();
        }
      }

    } catch (error) {
      console.error("❌ Sequence Scheduler Error:", error);
    }
  });
};

// Helper: "2d" -> Milliseconds
function parseDelay(delayStr) {
   if (!delayStr) return 0;
   const unit = delayStr.slice(-1);
   const val = parseInt(delayStr);
   if (unit === 'd') return val * 24 * 60 * 60 * 1000;
   if (unit === 'h') return val * 60 * 60 * 1000;
   if (unit === 'm') return val * 60 * 1000;
   return 0;
}
import { createProSubscription } from "../services/billing.service.js";
import { Business } from "../shared/models/Business.model.js";

export async function subscribePro(req, res) {
    try {
        const { businessId } = req.body;

        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ error: "Business not found" });
        }

        const subscription = await createProSubscription(business);

        res.json({
            success: true,
            razorpaySubscriptionId: subscription.razorpaySubscriptionId
        });
    } catch (err) {
        console.error("❌ SUBSCRIPTION ERROR:");
        console.error(err); // 🔥 THIS IS IMPORTANT

        res.status(500).json({
            error: "Subscription failed",
            reason: err.message
        });
    }

}

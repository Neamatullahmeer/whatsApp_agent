import { Business } from "../shared/models/Business.model.js";
import { Usage } from "../shared/models/Usage.model.js";
import { User } from "../shared/models/User.model.js";

// 📊 GET: Super Admin Dashboard Stats
export const getAdminDashboard = async (req, res) => {
  try {
    // 1. Saare Businesses nikalo
    const businesses = await Business.find().select("-apiKey -apiSecret");

    // 2. Current Month ka Usage nikalo
    const currentMonth = new Date().toISOString().slice(0, 7); // "2024-05"
    
    // 3. Data Aggregate karo (Business + Usage)
    const report = await Promise.all(
      businesses.map(async (biz) => {
        // Is business ka usage dhundo
        const usage = await Usage.findOne({ businessId: biz._id, month: currentMonth });
        
        // Is business ka owner dhundo
        const owner = await User.findOne({ businessId: biz._id, role: "owner" }).select("name email phone");

        return {
          _id: biz._id,
          name: biz.name,
          ownerName: owner?.name || "Unknown",
          ownerPhone: owner?.phone || "N/A",
          status: biz.status, // active/suspended
          plan: biz.subscription?.plan || "Free",
          
          // 📉 Consumption Stats
          whatsappUsage: usage?.messages || 0,
          aiTokens: usage?.aiTokens || 0, // Agar AI usage track kar rahe ho
          lastActive: biz.updatedAt
        };
      })
    );

    // 4. Total Summary for Cards
    const summary = {
      totalClients: businesses.length,
      activeClients: businesses.filter(b => b.status === 'active').length,
      totalMessages: report.reduce((sum, item) => sum + item.whatsappUsage, 0),
      revenueEstimate: report.length * 1500 // Example calculation
    };

    res.json({ success: true, data: { summary, clients: report } });

  } catch (error) {
    console.error("Admin Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// 🚫 Block/Unblock Business
export const toggleBusinessStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'suspended'
    
    await Business.findByIdAndUpdate(id, { status });
    res.json({ success: true, message: `Business is now ${status}` });
};
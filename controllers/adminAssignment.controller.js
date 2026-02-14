import { assignConversation } from "../services/assignment.service.js";
import { findBestAgent } from "../services/autoAssignment.service.js"; 
import { User } from "../shared/models/User.model.js";

export async function assignChat(req, res) {
  try {
    const { conversationId, agentId, strategy, skill } = req.body;
    // strategy options: 'ROUND_ROBIN', 'LEAST_BUSY', 'SKILL_BASED'
    
    const { _id: adminId, businessId } = req.user; 
    
    // 1️⃣ Validation: Conversation ID zaroori hai
    if (!conversationId) {
      return res.status(400).json({ success: false, error: "Conversation ID is required" });
    }

    let finalAgentId = agentId;
    let assignmentMode = "MANUAL"; // Track karne ke liye ki auto hua ya manual

    // 🤖 2️⃣ AUTO ASSIGNMENT LOGIC (Agar agentId nahi bheja)
    if (!finalAgentId) {
      assignmentMode = "AUTO";
      console.log(`🤖 Finding agent using strategy: ${strategy || 'ROUND_ROBIN'}`);

      // Best Agent Dhundo
      const bestAgent = await findBestAgent({
        businessId,
        strategy: strategy || "ROUND_ROBIN", // Default to Round Robin
        requiredSkill: skill // Optional: e.g., 'sales'
      });

      // Agar koi agent available nahi hai (sab offline ya busy)
      if (!bestAgent) {
        return res.status(404).json({ 
          success: false, 
          error: "No available agents found. Please check if agents are 'Online' and 'Active'." 
        });
      }

      finalAgentId = bestAgent._id;

      // 🕒 CRITICAL: Agent ka 'lastAssignedAt' update karo
      // Ye zaroori hai taaki agli request same agent ko na mile (Round Robin logic)
      await User.updateOne(
        { _id: finalAgentId }, 
        { $set: { lastAssignedAt: new Date() } }
      );
      
      console.log(`✅ Auto-Assigned to: ${bestAgent.name} (${finalAgentId})`);
    }

    // 📝 3️⃣ MAIN ASSIGNMENT SERVICE CALL
    // Ye service conversation ko update karegi aur message history mein entry karegi
    const updatedConversation = await assignConversation({
      conversationId,
      userId: finalAgentId,
      assignedBy: adminId,
      businessId
    });

    // 4️⃣ Success Response
    res.json({ 
      success: true, 
      message: `Conversation assigned successfully via ${assignmentMode} mode`, 
      assignedTo: finalAgentId,
      agentName: updatedConversation?.assignedTo?.name || "Agent", // Agar service populate karke de rahi hai
      mode: assignmentMode
    });

  } catch (error) {
    console.error("❌ Assign Chat Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    });
  }
}
import { User } from "../shared/models/User.model.js";
import { Conversation } from "../shared/models/Conversation.model.js";

export async function findBestAgent({ businessId, strategy = "ROUND_ROBIN", requiredSkill }) {
  
  // Base Query
  let query = { 
    businessId, 
    role: "agent", 
    status: "active", // Make sure field name matches DB (active vs status)
    isOnline: true 
  };

  // Skill Filter
  if (strategy === "SKILL_BASED" && requiredSkill) {
    query.department = requiredSkill;
  }

  /* ──────────────────────────────────────────
     STRATEGY 1: ROUND ROBIN (DB Level Sort) 🚀
     "Wo banda do jiska lastAssignedAt sabse purana ho"
  ────────────────────────────────────────── */
  if (strategy === "ROUND_ROBIN" || strategy === "SKILL_BASED") {
    // Hum JS sort ki jagah DB sort use karenge -> Faster!
    const bestAgent = await User.findOne(query)
      .sort({ lastAssignedAt: 1 }) // 1 = Oldest first (Ascending)
      .limit(1);
      
    return bestAgent;
  }

  /* ──────────────────────────────────────────
     STRATEGY 2: LEAST BUSY (Load Balancing) ⚖️
     "Wo banda do jiske paas sabse kam active chats ho"
  ────────────────────────────────────────── */
  if (strategy === "LEAST_BUSY") {
    // Pehle saare eligible agents nikalo
    const agents = await User.find(query).select("_id name");

    if (!agents.length) return null;

    // Sabka workload check karo
    const agentWorkloads = await Promise.all(
      agents.map(async (agent) => {
        const count = await Conversation.countDocuments({
          assignedTo: agent._id,
          status: { $in: ["open", "human"] }, // Sirf active chats count karo (closed nahi)
          businessId // Safety check
        });
        return { agent, count };
      })
    );

    // Sort: Sabse kam kaam wala upar
    agentWorkloads.sort((a, b) => a.count - b.count);
    
    // Agar sabke paas 0 chats hain, to Round Robin fallback ho jayega (workloads[0])
    return agentWorkloads[0]?.agent;
  }

  return null;
}
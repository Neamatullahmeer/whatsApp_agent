import { Campaign } from "../shared/models/Campaign.model.js";
import { getTargetAudience } from "../services/audience.service.js";
import { messageQueue } from "../queue/message.queue.js"; 

// ✅ 1. Create Draft
export const createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      businessId: req.user.businessId, // Auth middleware se milega
      status: "draft"
    });
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ 2. Get All Campaigns (For UI List)
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ businessId: req.user.businessId })
      .sort({ createdAt: -1 }); // Latest pehle
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
};

// ✅ 3. Launch Campaign (Manual Blast)
export const launchCampaign = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findOne({ _id: campaignId, businessId: req.user.businessId });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    if (campaign.status === "processing" || campaign.status === "completed") {
        return res.status(400).json({ error: "Campaign already launched" });
    }

    // A. Status Update
    campaign.status = "processing";
    await campaign.save();

    // B. Audience Fetch
    const users = await getTargetAudience(campaign.businessId, campaign.audience);
    
    // C. Stats Init
    campaign.stats.total = users.length;
    await campaign.save();

    console.log(`🚀 Launching Campaign: ${campaign.name} for ${users.length} users`);

    // D. Add to Queue
    const jobs = users.map((user) => ({
      name: "send_campaign_msg",
      data: {
        campaignId: campaign._id,
        businessId: campaign.businessId,
        to: user.userPhone,
        userName: user.name,
        templateName: campaign.content.templateName,
        templateParams: campaign.content.templateParams,
        type: "template"
      }
    }));

    await messageQueue.addBulk(jobs);

    res.json({ message: `Campaign launched for ${users.length} users!`, campaignId: campaign._id });

  } catch (error) {
    console.error("Campaign Launch Error:", error);
    res.status(500).json({ error: "Failed to launch campaign" });
  }
};

// ✅ 4. Toggle Sequence Status (Active <-> Paused)
export const toggleSequenceStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'active' or 'paused'
        const campaign = await Campaign.findOneAndUpdate(
            { _id: req.params.campaignId, businessId: req.user.businessId },
            { status },
            { new: true }
        );
        res.json(campaign);
    } catch (error) {
        res.status(500).json({ error: "Failed to update status" });
    }
};

// ✅ 5. Delete Campaign
export const deleteCampaign = async (req, res) => {
  try {
    await Campaign.deleteOne({ _id: req.params.campaignId, businessId: req.user.businessId });
    res.json({ message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
};
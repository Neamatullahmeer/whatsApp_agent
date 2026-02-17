import { Lead } from "../shared/models/Lead.model.js";

// ✅ 1. Get All Leads (Fetch)
export const getLeads = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { search } = req.query;
    
    console.log(`🔍 [Fetch] Request received for Business: ${businessId}, Search: "${search || ''}"`);

    const query = { businessId };

    if (search) {
      query.$or = [
        { userPhone: { $regex: search, $options: "i" } },
        { "data.name": { $regex: search, $options: "i" } }
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    console.log(`✅ [Fetch] Total leads found: ${leads.length}`);
    
    res.json({ success: true, data: leads });
  } catch (error) {
    console.error("❌ [Fetch] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ 2. Create New Lead (Add Contact)
export const createLead = async (req, res) => {
  try {
    const { name, phone, stage, tags, type } = req.body; // 'type' bhi add kar diya hai agar frontend bhejta hai
    const businessId = req.user.businessId;

    console.log("🚀 [Create] Attempting to create lead:", { name, phone, businessId });

    if (!phone) {
      return res.status(400).json({ success: false, error: "Phone number is required" });
    }

    // Duplicate Check
    const exists = await Lead.findOne({ businessId, userPhone: phone });
    if (exists) {
      console.log("⚠️ [Create] Lead already exists for this phone");
      return res.status(400).json({ success: false, error: "Lead with this phone already exists" });
    }

    const lead = await Lead.create({
      businessId,
      userPhone: phone,
      type: type || 'lead', // Default to lead if not provided
      stage: stage || 'new',
      source: 'manual',
      data: {
        name: name,
        tags: tags || []
      }
    });

    console.log("✅ [Create] Lead created successfully:", lead._id);
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error("❌ [Create] Error:", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

// ✅ 3. Update Lead (Edit Contact - FIXED)
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    // Yahan maine 'type' add kiya hai taaki status bhi update ho sake
    const { name, stage, tags, type } = req.body; 
    const businessId = req.user.businessId;

    console.log(`🔄 [Update] Request for Lead ID: ${id}`);

    const lead = await Lead.findOne({ _id: id, businessId });
    if (!lead) {
      console.log("❌ [Update] Lead not found in your business");
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    // Updating top-level fields
    if (stage) lead.stage = stage;
    if (type) lead.type = type; // Fix: User type ab update hoga (Lead -> Customer)

    // Updating nested 'data' object safely
    // Purana data retain karein, sirf naya data overwrite karein
    lead.data = {
        ...(lead.data || {}), // Purana data object (ya empty agar null hai)
        ...(name && { name }), // Sirf tab update karein agar naya name aaya ho
        ...(tags && { tags })  // Sirf tab update karein agar naye tags aaye hon
    };

    // Mongoose ko explicitly batayein ki 'data' field change hua hai
    lead.markModified('data');

    await lead.save();
    console.log("✅ [Update] Lead updated successfully");
    res.json({ success: true, data: lead });
  } catch (error) {
    console.error("❌ [Update] Error:", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

// ✅ 4. Delete Lead
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;

    console.log(`🗑️ [Delete] Attempting to delete Lead: ${id}`);

    const result = await Lead.findOneAndDelete({ _id: id, businessId });
    
    if (!result) {
        return res.status(404).json({ success: false, error: "Lead not found" });
    }

    console.log("✅ [Delete] Lead deleted successfully");
    res.json({ success: true, message: "Lead deleted" });
  } catch (error) {
    console.error("❌ [Delete] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
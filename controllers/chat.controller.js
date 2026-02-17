import { Conversation } from "../shared/models/Conversation.model.js";
import { Message } from "../shared/models/Message.model.js";
import { Lead } from "../shared/models/Lead.model.js";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js";

// 📋 1. Get Chat List (Left Sidebar)
export const getConversations = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    // Active conversations dhoondo (Sorted by Newest)
    const conversations = await Conversation.find({ businessId })
      .sort({ lastMessageAt: -1 })
      .limit(50); // Top 50 recent chats

    // Har conversation ke liye User ka Naam (Lead table se) layenge
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lead = await Lead.findOne({ businessId, userPhone: conv.userPhone }).select("profileName type");
        
        // Last message snippet nikalne ke liye
        const lastMsg = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .select("text from createdAt");

        return {
          _id: conv._id,
          userPhone: conv.userPhone,
          userName: lead?.profileName || "Unknown User",
          userType: lead?.type || "visitor", // visitor/lead
          status: conv.status, // active/human
          lastMessage: lastMsg?.text || "",
          lastMessageTime: lastMsg?.createdAt || conv.lastMessageAt,
          unread: 0 // Future implementation
        };
      })
    );

    res.json({ success: true, data: enrichedConversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 💬 2. Get Messages (Right Chat Window)
export const getMessages = async (req, res) => {
  try {
    const { phone } = req.params;
    const businessId = req.user.businessId;

    // Conversation ID nikalo
    const conversation = await Conversation.findOne({ businessId, userPhone: phone });
    
    if (!conversation) return res.json({ success: true, data: [] });

    // Messages laao (Oldest first for chat view)
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 }) 
      .limit(100);

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📤 3. Send Manual Message (Agent Reply)
export const sendMessage = async (req, res) => {
  try {
    const { phone, text } = req.body;
    const businessId = req.user.businessId;

    // WhatsApp API call karo
    await sendWhatsAppMessage(phone, { text }, req.user.phoneNumberId); // Business ka phone ID chahiye

    // Conversation dhoondo ya banao
    let conversation = await Conversation.findOne({ businessId, userPhone: phone });
    if (!conversation) {
      conversation = await Conversation.create({ 
        businessId, userPhone: phone, status: "human", lastMessageAt: new Date() 
      });
    } else {
        // Update last active time
        conversation.lastMessageAt = new Date();
        await conversation.save();
    }

    // Database mein save karo
    const newMessage = await Message.create({
      conversationId: conversation._id,
      from: "agent",
      text: text,
      status: "sent"
    });

    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error("Send Error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// 🤖 4. Toggle Human/Bot Mode
export const toggleBotMode = async (req, res) => {
    try {
        const { phone, status } = req.body; // status: 'active' (Bot) or 'human' (Agent)
        const businessId = req.user.businessId;

        await Conversation.findOneAndUpdate(
            { businessId, userPhone: phone },
            { status: status }
        );

        res.json({ success: true, message: `Chat mode switched to ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
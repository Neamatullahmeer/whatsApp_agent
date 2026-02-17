import { User } from "../shared/models/User.model.js";
import { Business } from "../shared/models/Business.model.js"; 
import { signToken } from "../utils/jwt.js";

/**
 * 🏢 SAAS SIGNUP: Register New Business Owner
 */
export async function registerOwner(req, res) {
  try {
    const { businessName, name, phone, password, email } = req.body;

    // 1. Check if user exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // 2. Create New Business
    const business = await Business.create({
      profile: {
        name: businessName,
      },
      // ✅ FIX: Har baar Unique ID generate hogi
      phoneNumberId: `TEMP_${Date.now()}`, 
      status: 'active',
      subscription: {
        plan: 'free',
        status: 'active'
      }
    });

    // 3. Create Owner User
    const user = await User.create({
      businessId: business._id, 
      name,
      phone,
      email, 
      password,
      role: 'owner', 
      department: 'general', // ✅ 'admin' error bhi fix kar diya agar Enum issue tha
      active: true
    });

    // 4. Generate Token
    const token = signToken(user);

    // 5. Send Response
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        businessId: business._id, 
        businessName: business.profile.name 
      }
    });

  } catch (err) {
    console.error("Register Owner Error:", err);
    res.status(400).json({ error: err.message });
  }
}
// ... (Baaki functions 'signup' aur 'login' same rahenge)
export async function signup(req, res) {
    // ... (Old code same)
}

export async function login(req, res) {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);
    const business = await Business.findById(user.businessId);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        department: user.department,
        isOnline: user.isOnline,
        // ⚠️ Login mein bhi name 'profile.name' se aayega
        businessName: business?.profile?.name || "Unknown Business" 
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
}
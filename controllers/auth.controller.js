import { User } from "../shared/models/User.model.js";
import { signToken } from "../utils/jwt.js";

/**
 * 🆕 Signup (owner / admin / agent)
 */
export async function signup(req, res) {
  try {
    const {
      businessId,
      name,
      phone,
      password,
      role,
      department // 👈 New: Skill-based routing ke liye
    } = req.body;

    // Check if user exists
    const exists = await User.findOne({
      businessId,
      phone
    });

    if (exists) {
      return res
        .status(400)
        .json({ error: "User already exists" });
    }

    // Create User
    const user = await User.create({
      businessId,
      name,
      phone,
      password,
      role,
      // Agar department nahi diya to 'general' set hoga (Model default)
      department: department || "general",
      // lastAssignedAt aur active automatically default set ho jayenge
    });

    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        department: user.department, // ✅ Frontend ko pata chalega
        isOnline: user.isOnline
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * 🔐 Login
 */
export async function login(req, res) {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });

    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ error: "Invalid credentials" });
    }

    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        department: user.department, // ✅ Login pe bhi department bhejo
        isOnline: user.isOnline      // ✅ Online status bhi bhejo
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
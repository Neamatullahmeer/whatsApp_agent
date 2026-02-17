import jwt from "jsonwebtoken";
import { User } from "../shared/models/User.model.js";

/* =========================================================================
   🛡️ PROTECT MIDDLEWARE (Verifies Token)
   ========================================================================= */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. Token nikalo
      token = req.headers.authorization.split(" ")[1];

      // 2. Secret Key check
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("❌ [Middleware] FATAL: JWT_SECRET missing!");
        return res.status(500).json({ error: "Server Configuration Error" });
      }

      // 3. Verify Token
      const decoded = jwt.verify(token, secret);

      // 4. User dhoondo (Password mat lana)
      req.user = await User.findById(decoded.userId || decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ error: "User not found with this token" });
      }

      // ✅ Sab sahi hai, aage badho
      next();

    } catch (error) {
      console.error("❌ [Auth] Verification Failed:", error.message);
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};

/* =========================================================================
   🏢 BUSINESS ADMIN ONLY (Owner / Admin)
   ========================================================================= */
export const adminOnly = (req, res, next) => {
  // 'owner' aur 'admin' dono allow hain
  if (req.user && (req.user.role === "admin" || req.user.role === "owner")) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Business Admins only." });
  }
};

/* =========================================================================
   🦸‍♂️ SUPER ADMIN ONLY (SaaS Founder - GOD MODE)
   ========================================================================= */
export const superAdminOnly = (req, res, next) => {
  // Sirf 'superadmin' role allow hai (Jo database me manually set kiya gaya ho)
  if (req.user && req.user.role === "superadmin") {
    next();
  } else {
    console.warn(`⚠️ [Security] Unauthorized SuperAdmin access attempt by: ${req.user.email}`);
    res.status(403).json({ error: "Access denied. Super Admins only." });
  }
};

// Export alias (Existing code support ke liye)
export const requireAuth = protect;
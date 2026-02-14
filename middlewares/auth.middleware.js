import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      error: "Missing auth token"
    });
  }

  // Handle both "Bearer " (capital) and "bearer " (small)
  const token = header.replace(/Bearer /i, ""); 

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ✅ FIX: _id ko manually set karo taaki controller confuse na ho
    req.user = {
      _id: decoded.userId, // Mongoose style ID
      ...decoded           // Baaki data (businessId, role etc.)
    };

    next();
  } catch {
    res.status(401).json({
      error: "Invalid token"
    });
  }
}
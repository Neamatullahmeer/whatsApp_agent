// middlewares/role.middleware.js

export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Check karo user logged in hai ya nahi
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    // 2. Check karo user ka role allowed list mein hai ya nahi
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Access denied. You do not have permission." 
      });
    }

    // 3. Agar sab sahi hai, to aage badho
    next();
  };
};
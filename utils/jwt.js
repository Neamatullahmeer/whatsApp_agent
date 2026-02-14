import jwt from "jsonwebtoken";

export function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      businessId: user.businessId,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

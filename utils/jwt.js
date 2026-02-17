import jwt from "jsonwebtoken";

export const signToken = (user) => {
  // Ensure karein ki hum 'userId' aur 'id' dono bhej rahe hain taaki confusion na ho
  return jwt.sign(
    { 
      userId: user._id, 
      businessId: user.businessId,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};
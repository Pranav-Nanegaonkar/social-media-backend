import jwt from "jsonwebtoken";

export const generateToken = (userData) => {
  // Return a pure string token
  return jwt.sign(userData, process.env.SECRET_KEY, { expiresIn: "7d" });
};

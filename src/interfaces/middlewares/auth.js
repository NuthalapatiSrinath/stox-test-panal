import jwt from "jsonwebtoken";
export const generateToken = (
  payload,
  expiresIn = process.env.JWT_EXPIRES_IN || "1d"
) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};
export const verifyTokenFromRequest = (req) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token missing");
  }

  const token = authHeader.split(" ")[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

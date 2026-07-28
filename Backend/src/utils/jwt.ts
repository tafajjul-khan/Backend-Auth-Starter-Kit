import jwt, { JwtPayload } from "jsonwebtoken";

export interface UserTokenPayload extends JwtPayload {
  userId: string;
  email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";

export const generateToken = (payload: UserTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token: string): UserTokenPayload => {
  try {
    const decode = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    return decode;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

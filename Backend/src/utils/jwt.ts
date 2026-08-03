import jwt, { SignOptions } from "jsonwebtoken";
import {
  IAccessTokenPayload,
  IEmailTokenPayload,
} from "../interfaces/user.interfaces.ts";
import crypto from "crypto";
import dotenv from "dotenv"
dotenv.config()
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

export const generateAccessToken = (payload: IAccessTokenPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (): { token: string; expiresAt: Date } => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 15); // 15 days
  return { token, expiresAt };
};

export const generateTokenForEmail = (
  payload: IEmailTokenPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
): string => {
  return jwt.sign(payload, secret, {
    ...(expiresIn !== undefined && { expiresIn }),
  });
};

export const verifyEmailVerficationToken = (token: string, secret: string) => {
  try {
    const decode = jwt.verify(token, secret) as IEmailTokenPayload;
    return decode;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

import { Request, Response, NextFunction } from "express";
import { UserTokenPayload, verifyToken } from "../utils/jwt.ts";

export interface AuthenticateedRequest extends Request {
  user?: UserTokenPayload;
}

export const authenticateJwt = (
  req: AuthenticateedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authheader = req.headers.authorization;
  // console.log("auth header", authheader)
  if (!authheader || !authheader.startsWith('Bearer ')) {
    res.status(401).json({
      message: "Authorization token missing or malfromed",
    });
    return;
  }

  const token = authheader.split(' ')[1] as string;
  // console.log("token", token)
  try {
    const decodePayload = verifyToken(token);
    req.user = decodePayload;
    next();
  } catch (error) {
    res.status(403).json({ message: "Forbidden: Access denied" });
  }
};

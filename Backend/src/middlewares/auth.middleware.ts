import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IAccessTokenPayload } from "../interfaces/user.interfaces.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../utils/appError.ts";

// const ACCESS_TOKEN_SECRET =
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

// Extend Express Request interface to include user information
export interface IAuthenticatedRequest extends Request {
  user?: IAccessTokenPayload;
}

export const validateAccessToken = asyncHandler<IAuthenticatedRequest>(
  async (req, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Access denied. No token provided");
    }
    // console.log("auth header: ", authHeader);
    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
    // console.log("Token: ", token);

    const decode = jwt.verify(
      token as string,
      ACCESS_TOKEN_SECRET,
    ) as IAccessTokenPayload;
    req.user = { userId: decode.userId, email: decode.email };
    next();
  },
);

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IAccessTokenPayload , IAccountRequest} from "../interfaces/user.interfaces.ts";

// const ACCESS_TOKEN_SECRET =
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

// Extend Express Request interface to include user information
// export interface IAuthenticatedRequest extends Request {
//   user?: IAccessTokenPayload;
// }

export const validateAccessToken = (
  req: IAccountRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
    return;
  }
  // console.log("auth header: ", authHeader);
  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
  // console.log("Token: ", token);

  try {
    const decode = jwt.verify(
      token as string,
      ACCESS_TOKEN_SECRET,
    ) as IAccessTokenPayload;
    req.user = { userId: decode.userId, email: decode.email };
    next();
  } catch (error) {
    // JWT Expiration handler
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Access token has expired.",
      });
      return;
    }

    // Invalid Token handler
    res.status(403).json({
      success: false,
      message: "Invalid access token.",
    });
    return;
  }
};

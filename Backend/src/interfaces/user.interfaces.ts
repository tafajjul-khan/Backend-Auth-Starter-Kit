import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

export interface IUser {
  userId: Types.ObjectId;
  userName: string;
  email: string;
  password: string;
  isVerified: boolean;
}

export interface IRefreshToken extends Document {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAccessTokenPayload extends JwtPayload {
  userId: string ;
  email: string;
}

export interface IEmailTokenPayload extends JwtPayload {
  userId: string ;
  email: string;
}






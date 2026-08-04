import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

interface IProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  bio: string;
  avatar: string;
  cloudinaryPublicId: string;
}

export interface IUser {
  userName: string;
  email: string;
  password: string;
  profile: IProfile;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  id: string;
  email: string;
}

export interface IEmailTokenPayload extends JwtPayload {
  userId: string;
  email: string;
}

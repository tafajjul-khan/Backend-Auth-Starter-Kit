import { Types, Document } from "mongoose";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

interface IAccount {
  fullName: INameDetails;
  DOB: Date | null;
  bio: string;
  avatar: string | null;
  cloudinaryPublicId: string | null;
}

interface INameDetails {
  firstName: string;
  lastName: string;
}

export interface IUser {
  userName: string;
  email: string;
  password: string;
  account: IAccount;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IRefreshToken extends Document {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
}

export interface IAccessTokenPayload extends JwtPayload {
  userId: Types.ObjectId;
  email: string;
}

export interface IEmailTokenPayload extends JwtPayload {
  userId: string;
  email: string;
}

export interface IAuthRequest extends Request {
  params: {
    userId: string;
  };
  cookies: {
    refreshToken: string;
  };
  query: {
    token: string;
  };
  user?: {
    id: string;
    email?: string;
  };

  body: {
    userName: string;
    email: string;
    password: string;
  };
}

export interface IAccountRequest extends Request {
  params: {
    userId: string;
  };
  user?: {
    userId: Types.ObjectId;
    email?: string;
  };
  body: {
    firstName?: string;
    lastName?: string;
    DOB?: Date;
    avatar?: string;
  };
}

export interface IAuthenticatedRequest extends Request {
  user?: IAccessTokenPayload;
}
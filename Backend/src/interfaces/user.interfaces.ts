import { Types, Document } from "mongoose";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

interface IAccount {
  fullName: INameDetails;
  // dob is derived atribute to count user age
  DOB: Date | null;
  bio: string;
  avatar: string;
  cloudinaryPublicId: string;
}
//  composite atribute
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

// refresh token payload to generate refresh token long lived
export interface IRefreshToken extends Document {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
}

// access token payload to generate access token short lived
export interface IAccessTokenPayload extends JwtPayload {
  userId: Types.ObjectId;
  email: string;
}

// token payload to generate token for email that send with targeted user email's
export interface IEmailTokenPayload extends JwtPayload {
  userId: string;
  email: string;
}

// custom auth request used in auth related controllers
export interface IAuthRequest extends Request {
  params: {
    id: string;
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


// custom account request used in account related controllers
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



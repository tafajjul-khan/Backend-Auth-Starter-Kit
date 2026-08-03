import mongoose, { Model, model, Schema, Types, Document } from "mongoose";
import { IUser,IRefreshToken,IUserMethods } from "../interfaces/user.interfaces.ts";
import bcrypt from "bcrypt";


type UserDocument = Document & IUser & IUserMethods;

const userSchema = new Schema<IUser, {}, IUserMethods>(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const refreshTokenSchema = new Schema<IRefreshToken>({
  token: { type: String, requierd: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", requierd: true },
  expiresAt: { type: Date, requierd: true },
});


refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

userSchema.pre("save", async function (this: UserDocument) {
  if (!this.isModified("password")) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
  } catch (error) {
    console.log("error while save password", error);
    throw error;
  }
});

userSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser, Model<IUser, {}, IUserMethods>>(
  "User",
  userSchema,
);

export const RefreshToken = model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema,
);

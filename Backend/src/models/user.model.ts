import { model, Schema } from "mongoose";
import { IRefreshToken, IUserDocument } from "../interfaces/user.interfaces.ts";
import bcrypt from "bcrypt";
import Logger from "../utils/logger.ts";

const userSchema = new Schema<IUserDocument>(
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
      trim: true,
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
    account: {
      fullName: {
        firstName: {
          type: String,
          lowercase: true,
          trim: true,
          default: " ",
        },
        lastName: {
          type: String,
          lowercase: true,
          trim: true,
          default: " ",
        },
      },
      DOB: {
        type: Date,
      },
      avatar: {
        type: String,
        default: null,
      },
      cloudinaryPublicId: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

const refreshTokenSchema = new Schema<IRefreshToken>({
  token: { type: String, requierd: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", requierd: true },
  expiresAt: { type: Date, required: true },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

userSchema.pre("save", async function (this: IUserDocument) {
  if (!this.isModified("password")) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
  } catch (error) {
    Logger.warn("error while save password in mognodb", error);
    throw error;
  }
});

// user schema method to compare hash password with incoming password completed by bcrypt
userSchema.methods.comparePassword = async function (
  this: IUserDocument,
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUserDocument>("User", userSchema);

export const RefreshToken = model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema,
);

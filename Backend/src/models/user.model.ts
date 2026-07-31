import mongoose, { Model, Schema, Types, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser {
  userId: Types.ObjectId
  userName: string;
  email: string;
  password: string;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}
type UserDocument = Document & IUser & IUserMethods;

const userSchema = new Schema<IUser, {}, IUserMethods>(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
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
  },
  { timestamps: true },
);

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
export const User = mongoose.model<IUser, Model<IUser, {}, IUserMethods>>(
  "User",
  userSchema,
);

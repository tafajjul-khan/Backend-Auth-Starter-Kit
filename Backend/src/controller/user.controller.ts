import { Request, Response } from "express";
import { RefreshToken, User } from "../models/user.model.ts";
import { IAccountRequest } from "../interfaces/user.interfaces.ts";
import { uploadImage, updateImage, deleteImage } from "../utils/cloudinary.ts";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../utils/appError.ts";
import { ApiResponse } from "../utils/apiResponse.ts";

export const getAllAccount = asyncHandler<IAccountRequest>(async () => {
  const users = await User.find({}).select("-password");
  if (!users) {
    throw new AppError(401, "No user documents found in db");
  }
  return new ApiResponse(200, "All users fetched succesfully", users);
});

export const uploadAvatar = asyncHandler<IAccountRequest>(async (req) => {
  if (!req.file || !req.file.path) {
    throw new AppError(400, "No image file provided");
  }

  const localFilePath = req.file.path;
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const cloudinaryResponse = await uploadImage(localFilePath);
    if (!cloudinaryResponse) {
      throw new AppError(500, "Failed to upload image to Cloudinary");
    }

    user.account.avatar = cloudinaryResponse.secure_url;
    user.account.cloudinaryPublicId = cloudinaryResponse.public_id;
    await user.save();

    return new ApiResponse(200, "Avatar uploaded successfully", {
      avatarUrl: user.account.avatar,
    });
  } finally {
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (unlinkError) {
      console.error("Failed to delete local file:", unlinkError);
    }
  }
});

export const updateAvatar = asyncHandler<IAccountRequest>(
  async (req: Request, res: Response) => {
    if (!req.file || !req.file.path) {
      throw new AppError(400, "No new image file provided");
    }

    const localFilePath = req.file.path;
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError(404, "User not found");
      }

      let cloudinaryResponse;

      if (user.account.cloudinaryPublicId) {
        cloudinaryResponse = await updateImage(
          user.account.cloudinaryPublicId,
          localFilePath,
        );
      } else {
        cloudinaryResponse = await uploadImage(localFilePath);
      }

      user.account.avatar = cloudinaryResponse.secure_url;
      user.account.cloudinaryPublicId = cloudinaryResponse.public_id;
      await user.save();

      return new ApiResponse(200, "Avatar updated successfully", {
        avatarUrl: user.account.avatar,
      }).send(res);
    } finally {
      try {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (unlinkError) {
        console.error("Failed to delete local temporary file:", unlinkError);
      }
    }
  },
);

export const removeAvatar = asyncHandler<IAccountRequest>(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (!user.account.cloudinaryPublicId) {
      throw new AppError(400, "No avatar found to delete");
    }

    await deleteImage(user.account.cloudinaryPublicId);

    user.account.avatar = null;
    user.account.cloudinaryPublicId = null;
    await user.save();

    return new ApiResponse(
      200,
      "Avatar deleted successfully from Cloudinary and DB",
    ).send(res);
  },
);

export const SaveOrUpdateAccount = asyncHandler<IAccountRequest>(
  async (req) => {
    // get user firstName,lastName,DOB from body
    const { firstName, lastName, DOB } = req.body;

    // get user id from params
    const userId = req.user?.userId;

    // find user and update user filed in db
    const updatedUserField = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "account.fullName.firstName": firstName,
          "account.fullName.lastName": lastName,
          "account.DOB": DOB ? new Date(DOB) : null,
        },
      },
      { returnDocument: "after", runValidators: true },
    ).select("-password");

    // if not save details then send user not found
    if (!updatedUserField) {
      throw new AppError(404, "User not found");
    }

    return new ApiResponse(
      200,
      "Account fields update and save successfully!",
      updatedUserField,
    );
  },
);

export const deleteAccount = asyncHandler<IAccountRequest>(async (req) => {
  // get user id from  params
  const { userId } = req.params;
  // console.log("user id: ", id);

  const user = await User.findById(userId);

  if (!user) {
    // if user not found then send  "Soft Delete Failed: User not found"
    throw new AppError(404, "Soft Delete Failed: User not found");
  }

  // delete avtar from cloudinary
  if (user.account.cloudinaryPublicId !== null) {
    await deleteImage(user.account.cloudinaryPublicId as string);
  }

  // find user by id and delete all refresh token documents
  await RefreshToken.deleteMany({ userId: user._id });

  // finnaly delete user document from mongodb
  const deletedUser = await User.findByIdAndDelete(userId);

  return new ApiResponse(
    200,
    "User Permanently Deleted Successfully!",
    deletedUser,
  );
});

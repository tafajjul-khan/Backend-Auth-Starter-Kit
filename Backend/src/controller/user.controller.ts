import { Request, Response } from "express";
import { RefreshToken, User } from "../models/user.model.ts";
import { IAccountRequest } from "../interfaces/user.interfaces.ts";
import { uploadImage, updateImage, deleteImage } from "../utils/cloudinary.ts";
import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../utils/appError.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import Logger from "../utils/logger.ts";

export const getAllAccount = asyncHandler<IAccountRequest>(async () => {
  Logger.info("Fetch all account data flow started");
  const users = await User.find({}).select("-password");

  Logger.info(
    "Fetch all acount data flow completed send response 200 with all user documetns",
  );

  return new ApiResponse(200, "All users fetched succesfully", users);
});

export const uploadAvatar = asyncHandler<IAccountRequest>(async (req) => {
  Logger.info("Upload avatar flow started...");
  if (!req.file || !req.file.path) {
    Logger.warn("Image not provided in path");
    throw new AppError(400, "No image file provided");
  }

  const localFilePath = req.file.path;
  const { userId } = req.params;

  try {
    Logger.info(`Find user with user id ${userId}`);
    const user = await User.findById(userId);
    if (!user) {
      Logger.warn(`user not found with user id ${userId}`);
      throw new AppError(404, "User not found");
    }

    Logger.info(`Upload avatar image with fille path: ${localFilePath}`);
    const cloudinaryResponse = await uploadImage(localFilePath);
    if (!cloudinaryResponse) {
      Logger.warn(
        `Failed to upload avatar image in cloudinary with file path: ${localFilePath}`,
      );
      throw new AppError(500, "Failed to upload image to Cloudinary");
    }

    Logger.info(`Save avatar info in mongodb with user id: ${userId}`);
    user.account.avatar = cloudinaryResponse.secure_url;
    user.account.cloudinaryPublicId = cloudinaryResponse.public_id;
    await user.save();

    Logger.warn(`Send 200 response for user : ${user}`);
    return new ApiResponse(200, "Avatar uploaded successfully", {
      avatarUrl: user.account.avatar,
    });
  } finally {
    try {
      if (fs.existsSync(localFilePath)) {
        Logger.info(
          `Delete local avatar file from sever disk storage: ${localFilePath}`,
        );
        fs.unlinkSync(localFilePath);
      }
    } catch (unlinkError) {
      Logger.warn("Failed to delete local file:", unlinkError);
    }
  }
});

export const updateAvatar = asyncHandler<IAccountRequest>(
  async (req: Request, res: Response) => {
    Logger.info("Update avatar flow started..");
    if (!req.file || !req.file.path) {
      Logger.warn("No image file provided for update");
      throw new AppError(400, "No new image file provided");
    }

    const localFilePath = req.file.path;
    const { userId } = req.params;

    try {
      Logger.info(`Find user with user id: ${userId}`);
      const user = await User.findById(userId);
      if (!user) {
        Logger.warn(`User not found with user id: ${userId}`);
        throw new AppError(404, "User not found");
      }

      let cloudinaryResponse;

      Logger.info(
        "Update image in cloudianry with local file path: ",
        localFilePath,
      );
      if (user.account.cloudinaryPublicId) {
        cloudinaryResponse = await updateImage(
          user.account.cloudinaryPublicId,
          localFilePath,
        );
      } else {
        cloudinaryResponse = await uploadImage(localFilePath);
      }

      Logger.info(
        `Save updated avatar info in mongodb with user id: ${userId}`,
      );
      user.account.avatar = cloudinaryResponse.secure_url;
      user.account.cloudinaryPublicId = cloudinaryResponse.public_id;
      await user.save();

      Logger.info(
        `Send 200 response for avatar updated flow and user with id: ${userId}`,
      );
      return new ApiResponse(200, "Avatar updated successfully", {
        avatarUrl: user.account.avatar,
      }).send(res);
    } finally {
      try {
        if (fs.existsSync(localFilePath)) {
          Logger.info(
            `Delete local avatar file from sever disk storage: ${localFilePath}`,
          );
          fs.unlinkSync(localFilePath);
        }
      } catch (unlinkError) {
        Logger.warn("Failed to delete local temporary file:", unlinkError);
      }
    }
  },
);

export const removeAvatar = asyncHandler<IAccountRequest>(
  async (req: Request, res: Response) => {
    Logger.info("Remove avatar flow start..");
    const { userId } = req.params;

    Logger.info(`Find user with user id: ${userId}`);
    const user = await User.findById(userId);
    if (!user) {
      Logger.warn(`User not found with user id: ${userId}`);
      throw new AppError(404, "User not found");
    }

    if (!user.account.cloudinaryPublicId) {
      Logger.warn(
        `Cloudinary public id not found in user document user id: ${userId}`,
      );
      throw new AppError(400, "No avatar found to delete");
    }

    Logger.info(
      `Delete avatar image from cloudianry with publicId: ${user.account.cloudinaryPublicId}`,
    );
    await deleteImage(user.account.cloudinaryPublicId);

    Logger.info(
      "Save null in avatar and cloudinary public id in user document in mongodb",
    );
    user.account.avatar = null;
    user.account.cloudinaryPublicId = null;
    await user.save();

    Logger.info(
      `Send response 200 for remove avatar for user with user id: ${userId}`,
    );
    return new ApiResponse(
      200,
      "Avatar deleted successfully from Cloudinary and DB",
    ).send(res);
  },
);

export const SaveOrUpdateAccount = asyncHandler<IAccountRequest>(
  async (req) => {
    Logger.info("User account save and update flow start..");
    const { firstName, lastName, DOB } = req.body;

    const userId = req.user?.userId;

    Logger.info(
      `Update and save user info in mongodb with user id : ${userId}`,
    );
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

    if (!updatedUserField) {
      Logger.warn(`User not found in mongodb with user id: ${userId}`);
      throw new AppError(404, "User not found");
    }

    Logger.info(
      `Send response for user save and update in mongodb for user: ${updatedUserField}`,
    );
    return new ApiResponse(
      200,
      "Account fields update and save successfully!",
      updatedUserField,
    );
  },
);

export const deleteAccount = asyncHandler<IAccountRequest>(async (req) => {
  Logger.info("User accound delete flow satrted...");
  const { userId } = req.params;

  Logger.info(`Find user in mongodb with user id: ${userId}`);
  const user = await User.findById(userId);

  if (!user) {
    Logger.warn(`User not found with user id: ${userId}`);
    throw new AppError(404, "Soft Delete Failed: User not found");
  }

  if (user.account.cloudinaryPublicId !== null) {
    Logger.info(
      `Delete avatar image from cloudinary with cloudinary publicId: ${user.account.cloudinaryPublicId}`,
    );
    await deleteImage(user.account.cloudinaryPublicId as string);
  }

  Logger.info(
    `Delete all refresh token document from mongodb related to userId: ${userId}`,
  );
  await RefreshToken.deleteMany({ userId: user._id });

  Logger.info(`Delete user from mongodb with user id: ${userId}`);
  const deletedUser = await User.findByIdAndDelete(userId);

  Logger.info(
    `Send response 200 fro user account deleted from db for user with user id : ${userId}`,
  );
  return new ApiResponse(
    200,
    "User Permanently Deleted Successfully!",
    deletedUser,
  );
});

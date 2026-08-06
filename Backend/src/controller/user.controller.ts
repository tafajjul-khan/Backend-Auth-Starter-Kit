import { Request, Response } from "express";
import { RefreshToken, User } from "../models/user.model.ts";
import { IAccountRequest } from "../interfaces/user.interfaces.ts";
import { uploadImage, updateImage, deleteImage } from "../utils/cloudinary.ts";
import fs from "fs";

export async function getAllProfile(req: Request, res: Response) {
  // console.log("req", req);
  try {
    const users = await User.find({}).select("-password");
    return res
      .status(200)
      .json({ message: "All users fetched succesfully", users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function uploadAvatar(req: Request, res: Response) {
  // get avatar file path
  if (!req.file || !req.file.path) {
    // return res if not file path
    return res.status(400).json({ message: "No image file provided" });
  }
  const localFilePath = req.file.path;
  // get user id from params
  const { userId } = req.params;

  try {
    // find user in db by user id
    const user = await User.findById(userId);
    // if not user send res user not found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // upload file in cloudinary
    const cloudinaryResponse = await uploadImage(localFilePath);

    // save url and publicId of avatar in Mongodb from cloudianry
    user.account.avatar = cloudinaryResponse.secure_url;
    user.account.cloudinaryPublicId = cloudinaryResponse.public_id;
    await user.save();

    // send response
    return res.status(200).json({
      message: "Avatar uploaded successfully",
      avatarUrl: user.account.avatar,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Upload failed" });
  } finally {
    // temp files delete from local disk sotrage
    try {
      fs.unlinkSync(localFilePath);
    } catch {}
  }
}

export async function updateAvatar(req: Request, res: Response) {
  // get file path
  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: "No new image file provided" });
  }

  const localFilePath = req.file.path;
  // user id from params
  const { userId } = req.params;

  try {
    // find user from db using user id
    const user = await User.findById(userId);
    // return user not found if not user in db
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // write cloudianry response with publicId and file path
    let cloudinaryResponse;

    // if image already exists update it
    if (user.account.cloudinaryPublicId) {
      cloudinaryResponse = await updateImage(
        user.account.cloudinaryPublicId,
        localFilePath,
      );
    } else {
      // if not then upload it
      cloudinaryResponse = await uploadImage(localFilePath);
    }

    // save details from cloudinary to mongodb like url and publiic
    user.account.avatar = cloudinaryResponse.secure_url;
    user.account.cloudinaryPublicId = cloudinaryResponse.public_id;
    // save in mongodb
    await user.save();

    // send response
    return res.status(200).json({
      message: "Avatar updated successfully",
      avatarUrl: user.account.avatar,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Update failed" });
  } finally {
    // delete temperary file from diskstorage
    try {
      fs.unlinkSync(localFilePath);
    } catch {}
  }
}

export async function removeAvatar(req: Request, res: Response) {
  // get user id from params
  const { userId } = req.params;

  try {
    // fin user from mongodb with user id
    const user = await User.findById(userId);
    // send response for user not found in db with id
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // if not public_id then send response no avatar found in db
    if (!user.account.cloudinaryPublicId) {
      return res.status(400).json({ message: "No avatar found to delete" });
    }

    // delete avatar from cloudinary
    await deleteImage(user.account.cloudinaryPublicId);

    // set details null in mongodb
    user.account.avatar = null;
    user.account.cloudinaryPublicId = null;
    // save null details in mongoDb
    await user.save();

    return res
      .status(200)
      .json({ message: "Avatar deleted successfully from Cloudinary and DB" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Deletion failed" });
  }
}

export async function SaveOrUpdateProfile(req: IAccountRequest, res: Response) {
  // get user firstName,lastName,DOB from body
  const { firstName, lastName, DOB } = req.body;
  // get user id from params
  const userId = req.user?.userId;
  try {
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
    if (!updatedUserField)
      return res.status(404).json({ message: "User not found" });
    // send response
    return res.status(200).json({
      success: true,
      message: "Account save and update successfully",
      data: updatedUserField,
    });
  } catch (error) {
    console.error("Profile save and update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function deleteProfile(req: Request, res: Response) {
  // get user id from  params
  const { userId } = req.params;
  // console.log("user id: ", id);
  try {
    const user = await User.findById(userId);

    if (!user) {
      // if user not found then send  "Soft Delete Failed: User not found"
      return res.status(404).json({
        success: false,
        message: "Soft Delete Failed: User not found",
      });
    }

    
    // delete avtar from cloudinary
    if(user.account.cloudinaryPublicId !== null){
      await deleteImage(user.account.cloudinaryPublicId as string);
    }
    
    // find user by id and delete all refresh token documents
    await RefreshToken.deleteMany({userId: user._id});

    // finnaly delete user document from mongodb
    const deletedUser = await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User Permanently Deleted SuccessFully",
      data: deletedUser,
    });

  } catch (error) {
    console.error("Account Delete Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

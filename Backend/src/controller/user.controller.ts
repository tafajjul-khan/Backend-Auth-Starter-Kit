import { Request, Response } from "express";
import { RefreshToken, User } from "../models/user.model.ts";
import { IAccountRequest } from "../interfaces/user.interfaces.ts";

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

export async function SaveOrUpdateProfile(req: IAccountRequest, res: Response) {
  // get user firstName,lastName,bio,avatar,dateOfBirth
  const { firstName, lastName, DOB, avatar } = req.body;
  const userId = req.user?.userId;
  console.log("user id: ", userId);
  // save in upadte user db with fields
  // send res

  try {
    const updatedUserField = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "account.fullName.firstName": firstName,
          "account.fullName.lastName": lastName,
          "account.DOB": DOB ? new Date(DOB) : null,
          "account.avatar": avatar,
        },
      },
      { returnDocument: "after", runValidators: true },
    ).select("-password");

    if (!updatedUserField)
      return res.status(404).json({ message: "User not found" });

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
  // get user id in params
  const { userId } = req.params;
  // console.log("user id: ", id);
  try {
    // find user by id
    await RefreshToken.deleteMany({ user: userId });
    const deletedUser = await User.findByIdAndDelete(userId);

    // if not user by id send user not found by id
    if (!deletedUser) {
      // if user not found then send  "Soft Delete Failed: User not found"
      return res.status(404).json({
        success: false,
        message: "Soft Delete Failed: User not found",
      });
    }

    // finally user found then send res("user deleted successfully")
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

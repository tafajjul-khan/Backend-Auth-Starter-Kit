import { Request, Response } from "express";
import { User } from "../models/user.model.ts";

export async function getAllProfile(req: Request, res: Response) {
  console.log("req", req);
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

export interface ICustomRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export async function SaveOrUpdateProfile(req: ICustomRequest, res: Response) {
  // get user firstName,lastName,bio,avatar,dateOfBirth
  const { firstName, lastName, dateOfBirth, avatar } = req.body;
  const userId = req.user?.id;
  console.log("user id: ", userId)
  // save in upadte user db with fields
  // send res

  try {
    const updateUserField = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "profile.firstName": firstName,
          "profile.lastName": lastName,
          "profile.dateOfBirth": dateOfBirth ? new Date(dateOfBirth) : null,
          "profile.avatar": avatar,
        },
      },
      { returnDocument: "after", runValidators: true },
    ).select("-password");

    if (!updateUserField)
      return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      success: true,
      message: "Account save and update successfully",
      data: updateUserField,
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
  const { id } = req.params;
  // console.log("user id: ", id);
  try {
    // find user by id
    const deletedUser = await User.findByIdAndDelete(id);

    // if not user by id send user not found by id
    if (!deletedUser) {
      // if user not found then send  "Soft Delete Failed: User not found"
      return res
        .status(404)
        .json({ message: "Soft Delete Failed: User not found" });
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

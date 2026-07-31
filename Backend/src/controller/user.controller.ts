import { Request, Response } from "express";
import { User } from "../models/user.model.ts";
import { generateToken } from "../utils/jwt.ts";
import { after } from "node:test";

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await User.find({});
    return res
      .status(200)
      .json({ message: "all users fetched succesfully", users });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

export async function registerUser(req: Request, res: Response) {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      res.status(401).json({ message: "all field are requierd" });
    }
    const newUser = await User.create({
      userName,
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: "user register successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(401).json({ message: "all field are requierd" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: "user not found" });
    }

    const isPasswordCorrect: boolean = await user!.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken({
      userId: user?.id as string,
      email: user?.email as string,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Login successful!", data: user });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function logoutUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(401).json({ message: "all field are requierd" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: "user not found" });
    }

    const isPasswordCorrect: boolean = await user!.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
    });

    return res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { email, newUsername, newEmail, password } = req.body;
    if (!email || !password) {
      res.status(401).json({
        message: "old email and password required for update account",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "user not found" });
    }

    const isPasswordCorrect: boolean = await user!.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const updatedUser = await User.findOneAndUpdate(
      {_id: user!.id},
      { $set: { email: newEmail, userName: newUsername } },
      {returnOriginal: false }
    ).lean();
    return res
      .status(200)
      .json({
        success: true,
        message: "Email updated successfully",
        data: updatedUser,
      });
  } catch (error) {
    console.error("email update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

import { Request, Response } from "express";
import { User } from "../models/user.model.ts";
import { generateToken, verifyToken } from "../utils/jwt.ts";
import { SendEmail } from "../utils/mail.ts";
import { send } from "node:process";

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

// fix bug when we regitser user it create document in mongodb but not handle verfication 
// verify email token bug relted to verify
export async function registerUser(req: Request, res: Response) {
  const { userName, email, password } = req.body;

  if (!userName || !email || !password) {
    return res.status(401).json({ message: "all field are requierd" });
  }
  try {
    const newUser = await User.create({
      userName,
      email,
      password,
      isVerified: false,
    });

    const verificationToken = generateToken({
      userId: newUser?.id as string,
      email: newUser?.email as string,
    });
    console.log("Token genereted", verificationToken)
    const verificationUrl = `${process.env.APP_URL}/api/user/verify?token=${verificationToken}`;

    const toEmail = newUser.email
    console.log("to email", email)

    await SendEmail({
      to: toEmail,
      subject: "Verify Your Email Address",
      html: `
        <h2>Welcome to Our App!</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Verify Email</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });
    res.status(200).json({
      success: true,
      message: "Verification email sent successfully!",
      data: newUser,
    });
  } catch (error) {
    console.error("Register/Email Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<any> {
  const { token  } = req.query;

  if (typeof token !== "string" || token.trim() === "") {
    return res.status(400).json({ message: "Invalid or missing token" });
  }
  try {
    const decodedToken = verifyToken(token);
    const email = decodedToken.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isVerified = true;
    await user.save();

    return res.status(200).send(`
      <h1>Email Verified Successfully!</h1>
      <p>Your email (${email}) has been confirmed. You can now log into your account.</p>
    `);
  } catch (error) {
    return res.status(400).json({ message: 'Token has expired or is invalid.' });
  }
}

// not verify not attempt to login logic 

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
    console.error("login Error:", error);
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
      { _id: user!.id },
      { $set: { email: newEmail, userName: newUsername } },
      { returnOriginal: false },
    ).lean();
    return res.status(200).json({
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

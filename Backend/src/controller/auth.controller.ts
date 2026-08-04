import { Request, Response } from "express";
import { RefreshToken, User } from "../models/user.model.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenForEmail,
  verifyEmailVerficationToken,
} from "../utils/jwt.ts";
import { sendVerificationEmail } from "../utils/email.ts";

export async function requestVerification(req: Request, res: Response) {
  console.log("request body: ", req.body);
  // get email
  const { email } = req.body;
  // console.log("new Email: ", newEmail)
  // get user id if login
  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }
    // generate token for send email
    const payload = {
      userId: user!.id as string,
      email: user!.email as string,
    };
    // console.log("email token payload: ", payload)
    const token = generateTokenForEmail(
      payload,
      process.env.ACCESS_TOKEN_SECRET as string,
      "24h",
    );
    // console.log("email token: ", token)

    // get targeted email from newEmail user and loggedInUser from user id
    const targetEmail = user.email;
    console.log("targeted email: ", targetEmail);

    // send email to targeted user
    try {
      await sendVerificationEmail(targetEmail, token);
    } catch (error) {
      console.log("send verififcation error: ", error);
    }

    // send response
    res.status(200).json({
      success: true,
      message: `Verification link successfully sent to ${targetEmail}`,
    });
  } catch (error) {
    console.log("Request verify Email error");
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;

  if (typeof token !== "string" || token.trim() === "") {
    return res.status(400).json({ message: "Invalid or missing token" });
  }
  const decodedToken = verifyEmailVerficationToken(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
  );
  const email = decodedToken.email;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: "Email Verified Successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Token has expired or is invalid." });
  }
}

export async function registerUser(req: Request, res: Response) {
  // upload avtar and profile pic in cloudinary
  // if fail not upload any data and res.send("avtar/profile not uploaded")
  // after completing image upload create user with isEmailVerified false
  // send user data
  try {
    // get username,email,password
    const { userName, email, password } = req.body;

    // validate it if not anything send res("All field requierd")
    if (!userName || !email || !password) {
      return res.status(401).json({ message: "all field are requierd" });
    }
    // check user exist already
    const userExists = await User.exists({
      $or: [{ email }, { userName }],
    });
    if (userExists) {
      res
        .status(409)
        .json({ message: "User already exist with UserName and Email" });
    }
    const newUser = await User.create({
      userName,
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: "User Registerd Successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Verfiy Email Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function loginUser(req: Request, res: Response) {
  // get email,username,password
  const { email, password } = req.body;
  // check it if not include email or username and password then res.send("All fields are requierd")
  if (!email || !password) {
    res.status(401).json({ message: "Email and password is requierd" });
  }
  try {
    // find user with email and username
    const user = await User.findOne({ email });
    // if  user not exists then res.send("User not found")
    if (!user) {
      res.status(401).json({ message: "user not found" });
    }
    // if user compare password with user give password with db password
    const isPasswordCorrect = await user!.comparePassword(password);
    // if password correct then check isEmailverified if false then

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    // generate aceess and refresh token
    const accessTokenPayload = {
      userId: user!.id as string,
      email: user!.email as string,
    };
    const accessToken = generateAccessToken(accessTokenPayload);

    const { token, expiresAt } = generateRefreshToken();
    await RefreshToken.findOneAndUpdate(
      { userId: user!._id },
      { token, expiresAt },
      { upsert: true, returnDocument: "after" },
    );

    // send session cookies to frontend
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 15 days
    });

    // send response with data
    return res
      .status(200)
      .json({ message: "Login successful!", data: user, accessToken });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function generateRefreshAndAccessTokens(
  req: Request,
  res: Response,
) {
  // get refrsh token from cookies
  const incomingRefreshToken = req.cookies.refreshToken;
  // cehck refresh token
  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "Refresh token is missing" });
  }

  try {
    // check refresh token in db
    const storedRefreshToken = await RefreshToken.findOne({
      token: incomingRefreshToken,
    });
    // if token not valid res.send invalid token
    if (!storedRefreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // check token expiry
    if (new Date() > storedRefreshToken.expiresAt) {
      await storedRefreshToken.deleteOne();
      return res.status(403).json({ message: "Expired refresh token" });
    }

    // dlt old refresh token
    await storedRefreshToken.deleteOne();

    const user = await User.findById(storedRefreshToken.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // access toekn payload
    const accessTokenPayload = {
      userId: user.id as string,
      email: user.email as string,
    };

    // Generate a brand new pair
    const accessToken = generateAccessToken(accessTokenPayload);
    const { token: newRefreshToken, expiresAt } = generateRefreshToken();

    // Save new refresh token to DB
    await RefreshToken.create({
      token: newRefreshToken,
      userId: storedRefreshToken.userId,
      expiresAt,
    });

    // 4. Send new refresh token back in the cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // days
    });

    return res
      .status(200)
      .json({ message: "Access Token generate successfully!", accessToken });
  } catch (error) {
    console.error("generate refresh and access token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function logoutUser(req: Request, res: Response) {
  // check refresh token
  const incomingRefreshToken = req.cookies.refreshToken;
  // if invalid refresh token
  if (!incomingRefreshToken) {
    res.status(401).json({ message: "refresh token not valid" });
  }
  try {
    await RefreshToken.deleteOne({ token: incomingRefreshToken });

    res.clearCookie("refreshToken", {
      path: "/",
      // domain: "domainname"
      httpOnly: true,
      secure: true,
    });
    // send response Logout Successfully !
    return res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

import { RefreshToken, User } from "../models/user.model.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenForEmail,
  verifyEmailVerficationToken,
} from "../utils/jwt.ts";
import { sendVerificationEmail } from "../utils/email.ts";
import { IAuthRequest } from "../interfaces/user.interfaces.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../utils/appError.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import Logger from "../utils/logger.ts";

export const requestVerification = asyncHandler<IAuthRequest>(async (req) => {
  Logger.info("Email verfication start...");
  const { email } = req.body;

  Logger.info(`Searching for user with email: ${email} in MongoDB`);
  const user = await User.findOne({ email: email });

  if (!user) {
    Logger.warn(`User validation failed: Email ${email} not found`);
    throw new AppError(404, `User with ${email} not found`);
  }

  const payload = {
    userId: user!.id as string,
    email: user!.email as string,
  };

  Logger.info("Generating secure email verification token...");
  const token = generateTokenForEmail(
    payload,
    process.env.ACCESS_TOKEN_SECRET as string,
    "24h",
  );

  const targetEmail = user.email;

  Logger.info(`Sending verification email to: ${targetEmail}`);
  await sendVerificationEmail(targetEmail, token);

  Logger.info(
    `Verification flow complete. Sending 200 response for: ${targetEmail}`,
  );
  return new ApiResponse(
    200,
    `Verification link successfully sent to ${targetEmail}`,
  );
});

export const verifyEmail = asyncHandler<IAuthRequest>(async (req) => {
  Logger.info("Email verfifcation start...");
  const { token } = req.query;

  Logger.info(`Check types of token ${token}`);
  if (typeof token !== "string" || token.trim() === "") {
    Logger.warn("Invalid or missing token provided in verufy emial link");
    throw new AppError(401, "Invalid or missing Token");
  }

  Logger.info(`Start decode token ${token}`);
  const decodedToken = verifyEmailVerficationToken(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
  );

  Logger.info(`Decoded email from token ${token}`);
  const email = decodedToken.email;

  Logger.info(`Find user with decoded email ${email}`);
  const user = await User.findOne({ email });

  if (!user) {
    Logger.warn(`User not found with proided email in token ${email}`);
    throw new AppError(404, `User not found with this ${email}`);
  }

  Logger.info("Set isVerfied true in mognodb");
  user.isVerified = true;

  Logger.info(`Save user info in mongodb ${user.id}`);
  await user.save();

  Logger.info(
    `Email Verification link flow complete. Sending 200 response for: ${email}`,
  );
  return new ApiResponse(200, "Email verified Successfully!");
});

export const registerUser = asyncHandler<IAuthRequest>(async (req) => {
  Logger.info(`User Registration flow start...`);
  const { userName, email, password } = req.body;

  if (!userName || !email || !password) {
    Logger.warn(`User input field is not provided`);
    throw new AppError(401, "UserName and Email or password is requierd");
  }

  Logger.info(`find user with username: ${userName} and email: ${email}`);
  const userExists = await User.exists({ email: email });

  if (userExists) {
    Logger.warn(`User already Exists with this email ${email}`);
    throw new AppError(409, "User already Existed With this email");
  }

  Logger.info(`Create new User in mongoDb`);
  const newUser = await User.create({
    userName,
    email,
    password,
  });

  Logger.info(
    `Registration flow complete. Sending 200 response for: ${newUser}`,
  );
  return new ApiResponse(200, "User Registerd Successfully", newUser);
});

export const loginUser = asyncHandler<IAuthRequest>(async (req) => {
  Logger.info("User login start...");

  const { email, password } = req.body;

  if (!email || !password) {
    Logger.warn("User not provide credentials");
    throw new AppError(401, "Email or Username and password requierd");
  }

  Logger.info("User find in db");
  const user = await User.findOne({ email: email });

  if (!user) {
    Logger.warn("User not found in db");
    throw new AppError(401, "User Not found");
  }

  Logger.info("check password");
  const isPasswordCorrect = await user!.comparePassword(password);

  if (!isPasswordCorrect) {
    Logger.warn("User password is not coorect");
    throw new AppError(401, "Password is not correct");
  }

  const accessTokenPayload = {
    userId: user!._id,
    email: user!.email,
  };

  Logger.info("Generate tokens");
  const accessToken = generateAccessToken(accessTokenPayload);
  const { token, expiresAt } = generateRefreshToken();

  Logger.info("Update and save refresh token in db");
  await RefreshToken.findOneAndUpdate(
    { userId: user!._id },
    { token, expiresAt },
    { upsert: true, returnDocument: "after" },
  );

  Logger.info("Send response in frontend with cookies");
  return new ApiResponse(200, "User Login successfully", {
    user,
    accessToken,
  }).withCookie("refreshToken", token);
});

export const generateRefreshAndAccessTokens = asyncHandler<IAuthRequest>(
  async (req) => {
    Logger.info("Generation of access and refresh token start..");
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken) {
      Logger.warn("Refres token missing");
      throw new AppError(401, "Refresh token is missing");
    }

    Logger.info("find refresh token");
    const storedRefreshToken = await RefreshToken.findOne({
      token: incomingRefreshToken,
    });

    if (!storedRefreshToken) {
      Logger.warn("Invalid refresh token provided");
      throw new AppError(403, "Invalid Refresh token");
    }

    if (new Date() > storedRefreshToken.expiresAt) {
      Logger.info("Delete old expired refresh token");
      await storedRefreshToken.deleteOne();
      Logger.warn("Expired refresh token provided");
      throw new AppError(403, "Expired Refresh token");
    }

    Logger.info("Delete refresh token from db");
    await storedRefreshToken.deleteOne();

    Logger.info("Find user by refresh token user id");
    const user = await User.findById(storedRefreshToken.userId);

    if (!user) {
      Logger.warn("User not found with user id provided in refresh token");
      throw new AppError(404, "User not found");
    }

    const accessTokenPayload = {
      userId: user._id,
      email: user.email,
    };

    Logger.info("Generate new refresh and access token");
    const accessToken = generateAccessToken(accessTokenPayload);
    const { token: newRefreshToken, expiresAt } = generateRefreshToken();

    Logger.info("Create refresh token and save in db");
    await RefreshToken.create({
      token: newRefreshToken,
      userId: storedRefreshToken.userId,
      expiresAt,
    });

    Logger.info("Send reponse and cookies with refresh token");
    return new ApiResponse(
      200,
      "Access token generate succesfully",
      accessToken,
    ).withCookie("refreshToken", newRefreshToken);
  },
);

export const logoutUser = asyncHandler<IAuthRequest>(async (req) => {
  Logger.info("Logout started...");
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    Logger.warn("Invalid refresh token");
    throw new AppError(401, "Invalid refresh token");
  }

  Logger.info("Delete refresh token from db using Refresh Token");
  await RefreshToken.deleteOne({ token: incomingRefreshToken });

  Logger.info("Send response user logout successfully");
  Logger.info("Set refresh token ' '  in cookies ");
  return new ApiResponse(200, "User Logout Successfully").withCookie(
    "refreshToken",
    " ",
  );
});

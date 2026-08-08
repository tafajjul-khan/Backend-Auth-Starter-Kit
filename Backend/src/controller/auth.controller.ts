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

export const requestVerification = asyncHandler<IAuthRequest>(async (req) => {
  console.log("Email verfication start...");
  // get email from req.body
  const { email } = req.body;
  // find user with user email

  console.info("Find User in mongoDB");
  const user = await User.findOne({ email: email });

  // check user
  if (!user) {
    console.warn("User with email not found...");
    throw new AppError(404, `User with ${email} not found`);
  }

  // generate token for send email
  const payload = {
    userId: user!.id as string,
    email: user!.email as string,
  };

  console.info("Start generate tokens ...");
  // console.log("email token payload: ", payload)
  const token = generateTokenForEmail(
    payload,
    process.env.ACCESS_TOKEN_SECRET as string,
    "24h",
  );
  // console.log("email token: ", token)

  // get targeted email from newEmail user and loggedInUser from user id
  const targetEmail = user.email;
  // console.log("targeted email: ", targetEmail);

  // send email to targeted user
  console.info("Email send to targetd user");
  await sendVerificationEmail(targetEmail, token);

  // send response
  console.info("Send response to frontend");
  return new ApiResponse(
    200,
    `Verification link successfully sent to ${targetEmail}`,
  );
});

export const verifyEmail = asyncHandler<IAuthRequest>(async (req) => {
  console.info("email verfifcation startedd...");
  // get a token from req.query
  const { token } = req.query;
  // check and token type and trim it for original token
  console.info("check token types");
  if (typeof token !== "string" || token.trim() === "") {
    console.warn("Invalida or missing token provided in verify email");
    throw new AppError(401, "Invalid or missing Token");
  }

  // decode token to extract email
  console.info("Verfiy email token");
  const decodedToken = verifyEmailVerficationToken(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
  );

  // decode email
  console.info("decode email token");
  const email = decodedToken.email;

  // find user to tag isVerified true with email
  console.info("Find user with email");
  const user = await User.findOne({ email });

  // check user with email
  if (!user) {
    console.warn("User not found with email");
    throw new AppError(404, `User not found with this ${email}`);
  }
  console.info("Set user verified true.");
  // set isVerfied true
  user.isVerified = true;
  // save user
  console.info("Save user");
  await user.save();
  // send api response
  console.info("Send response");
  return new ApiResponse(200, "Email verified Successfully!");
});

export const registerUser = asyncHandler<IAuthRequest>(async (req) => {
  console.log("User registeration start ...");
  // get username,email,password
  const { userName, email, password } = req.body;

  // validate it if not anything send res("All field requierd")
  if (!userName || !email || !password) {
    console.warn("User filed not provided in fields");
    throw new AppError(401, "UserName and Email or password is requierd");
  }

  // check user exist already
  console.info("User existence in db");
  const userExists = await User.exists({
    $or: [{ email }, { userName }],
  });

  // check user existence
  if (userExists) {
    console.warn("User already exist with credentials");
    throw new AppError(409, "User already Existed With this email");
  }

  // create new user document in mongodb
  console.info("Create new user in db");
  const newUser = await User.create({
    userName,
    email,
    password,
  });
  console.info("User registerd successfully");
  // send api response
  return new ApiResponse(200, "User Registerd Successfully", newUser);
});

export const loginUser = asyncHandler<IAuthRequest>(async (req) => {
  console.log("User login start...");
  // get email,username,password
  const { email, userName, password } = req.body;

  // check it if not include email or username and password then res.send("All fields are requierd")
  if (!email || !userName || !password) {
    console.warn("User not provide credentials");
    throw new AppError(401, "Email or Username and password requierd");
  }

  // find user with email and username
  console.info("User find in db");
  const user = await User.findOne({
    $or: [{ email: email }, { userName: userName }],
  });

  // if  user not exists then res.send("User not found")
  if (!user) {
    console.warn("User not found in db");
    throw new AppError(401, "User Not found");
  }

  // if user compare password with user give password with db password
  console.info("check password");
  const isPasswordCorrect = await user!.comparePassword(password);

  // if password correct then check isEmailverified if false then
  if (!isPasswordCorrect) {
    console.warn("User password is not coorect");
    throw new AppError(401, "Password is not correct");
  }

  // generate aceess and refresh token
  const accessTokenPayload = {
    userId: user!._id,
    email: user!.email,
  };

  console.info("Generate tokens");
  const accessToken = generateAccessToken(accessTokenPayload);
  const { token, expiresAt } = generateRefreshToken();

  // update refreshToken
  console.info("Update and save refresh token in db");
  await RefreshToken.findOneAndUpdate(
    { userId: user!._id },
    { token, expiresAt },
    { upsert: true, returnDocument: "after" },
  );

  // send response
  console.info("Send response in frontend with cookies");
  return new ApiResponse(200, "User Login successfully", {
    user,
    accessToken,
  }).withCookie("refreshToken", token);
});

export const generateRefreshAndAccessTokens = asyncHandler<IAuthRequest>(
  async (req) => {
    // get refrsh token from cookies
    console.info("Generation of access and refresh token start..");
    const incomingRefreshToken = req.cookies.refreshToken;

    // cehck refresh token
    if (!incomingRefreshToken) {
      console.warn("Refres token missing");
      throw new AppError(401, "Refresh token is missing");
    }

    // check refresh token document in mongodb
    console.info("find refresh token");
    const storedRefreshToken = await RefreshToken.findOne({
      token: incomingRefreshToken,
    });

    // if token not valid res.send invalid token
    if (!storedRefreshToken) {
      console.warn("Invalid refresh token provided");
      throw new AppError(403, "Invalid Refresh token");
    }

    // check token expiry
    if (new Date() > storedRefreshToken.expiresAt) {
      console.info("Delete old expired refresh token");
      await storedRefreshToken.deleteOne();
      console.warn("Expired refresh token provided");
      throw new AppError(403, "Expired Refresh token");
    }

    // dlt old refresh token
    console.info("Delete refresh token from db");
    await storedRefreshToken.deleteOne();

    // find user with user id
    console.info("Find user by refresh token user id");
    const user = await User.findById(storedRefreshToken.userId);

    // check user
    if (!user) {
      console.warn("User not found with user id provided in refresh token");
      throw new AppError(404, "User not found");
    }

    // access toekn payload
    const accessTokenPayload = {
      userId: user._id,
      email: user.email,
    };

    // Generate a brand new pair
    console.info("Generate new refresh and access token");
    const accessToken = generateAccessToken(accessTokenPayload);
    const { token: newRefreshToken, expiresAt } = generateRefreshToken();

    // Save new refresh token to DB
    console.info("Create refresh token and save in db");
    await RefreshToken.create({
      token: newRefreshToken,
      userId: storedRefreshToken.userId,
      expiresAt,
    });

    console.info("Send reponse and cookies with refresh token");
    return new ApiResponse(
      200,
      "Access token generate succesfully",
      accessToken,
    ).withCookie("refreshToken", newRefreshToken);
  },
);

export const logoutUser = asyncHandler<IAuthRequest>(async (req) => {
  // check refresh token
  console.info("Logout started...");
  const incomingRefreshToken = req.cookies.refreshToken;

  // if invalid refresh token
  if (!incomingRefreshToken) {
    console.warn("Invalid refresh token");
    throw new AppError(401, "Invalid refresh token");
  }

  console.info("Delete refresh token from db using Refresh Token");
  await RefreshToken.deleteOne({ token: incomingRefreshToken });
  // send response Logout Successfully !
  console.info("Send response user logout successfully");
  console.info("Set refresh token ' '  in cookies ");
  return new ApiResponse(200, "User Logout Successfully").withCookie(
    "refreshToken",
    " ",
  );
});

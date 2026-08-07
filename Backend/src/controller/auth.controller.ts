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
  // get email from req.body
  const { email } = req.body;

  // find user with user email
  const user = await User.findOne({ email: email });

  // check user
  if (!user) {
    throw new AppError(404, `User with ${email} not found`);
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
  // console.log("targeted email: ", targetEmail);

  // send email to targeted user
  await sendVerificationEmail(targetEmail, token);

  // send response
  return new ApiResponse(
    200,
    `Verification link successfully sent to ${targetEmail}`,
  );
});

export const verifyEmail = asyncHandler<IAuthRequest>(async (req) => {
  // get a token from req.query
  const { token } = req.query;

  // check and token type and trim it for original token
  if (typeof token !== "string" || token.trim() === "") {
    throw new AppError(401, "Invalid or missing Token");
  }

  // decode token to extract email
  const decodedToken = verifyEmailVerficationToken(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
  );

  // decode email
  const email = decodedToken.email;

  // find user to tag isVerified true with email
  const user = await User.findOne({ email });

  // check user with email
  if (!user) {
    throw new AppError(404, `User not found with this ${email}`);
  }
  // set isVerfied true
  user.isVerified = true;
  // save user
  await user.save();
  // send api response
  return new ApiResponse(200, "Email verified Successfully!");
});

export const registerUser = asyncHandler<IAuthRequest>(async (req) => {
  // get username,email,password
  const { userName, email, password } = req.body;

  // validate it if not anything send res("All field requierd")
  if (!userName || !email || !password) {
    throw new AppError(401, "UserName and Email or password is requierd");
  }

  // check user exist already
  const userExists = await User.exists({
    $or: [{ email }, { userName }],
  });

  // check user existence
  if (userExists) {
    throw new AppError(409, "User already Existed With this email");
  }

  // create new user document in mongodb
  const newUser = await User.create({
    userName,
    email,
    password,
  });
  // send api response
  return new ApiResponse(200, "User Registerd Successfully", newUser);
});

export const loginUser = asyncHandler<IAuthRequest>(async (req) => {
  // get email,username,password
  const { email, userName, password } = req.body;

  // check it if not include email or username and password then res.send("All fields are requierd")
  if (!email || !userName || !password) {
    throw new AppError(401, "Email or Username and password requierd");
  }

  // find user with email and username
  const user = await User.findOne({
    $or: [{ email: email }, { userName: userName }],
  });

  // if  user not exists then res.send("User not found")
  if (!user) {
    throw new AppError(401, "User Not found");
  }

  // if user compare password with user give password with db password
  const isPasswordCorrect = await user!.comparePassword(password);

  // if password correct then check isEmailverified if false then
  if (!isPasswordCorrect) {
    throw new AppError(401, "Password is not correct");
  }

  // generate aceess and refresh token
  const accessTokenPayload = {
    userId: user!._id,
    email: user!.email,
  };

  const accessToken = generateAccessToken(accessTokenPayload);
  const { token, expiresAt } = generateRefreshToken();

  // update refreshToken
  await RefreshToken.findOneAndUpdate(
    { userId: user!._id },
    { token, expiresAt },
    { upsert: true, returnDocument: "after" },
  );

  // send response
  return new ApiResponse(200, "User Login successfully", {
    user,
    accessToken,
  }).withCookie("refreshToken", token);
});

export const generateRefreshAndAccessTokens = asyncHandler<IAuthRequest>(async (req) => {
  // get refrsh token from cookies
  const incomingRefreshToken = req.cookies.refreshToken;

  // cehck refresh token
  if (!incomingRefreshToken) {
    throw new AppError(401, "Refresh token is missing");
  }

  // check refresh token document in mongodb
  const storedRefreshToken = await RefreshToken.findOne({
    token: incomingRefreshToken,
  });

  // if token not valid res.send invalid token
  if (!storedRefreshToken) {
    throw new AppError(403, "Invalid Refresh token");
  }

  // check token expiry
  if (new Date() > storedRefreshToken.expiresAt) {
    await storedRefreshToken.deleteOne();
    throw new AppError(403, "Expired Refresh token");
  }

  // dlt old refresh token
  await storedRefreshToken.deleteOne();

  // find user with user id
  const user = await User.findById(storedRefreshToken.userId);

  // check user
  if (!user) {
    throw new AppError(404, "User not found");
  }

  // access toekn payload
  const accessTokenPayload = {
    userId: user._id,
    email: user.email,
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

  return new ApiResponse(
    200,
    "Access token generate succesfully",
    accessToken,
  ).withCookie("refreshToken", newRefreshToken);
});

export const logoutUser = asyncHandler<IAuthRequest>(async (req) => {
  // check refresh token
  const incomingRefreshToken = req.cookies.refreshToken;

  // if invalid refresh token
  if (!incomingRefreshToken) {
    throw new AppError(401, "Invalid refresh token");
  }

  await RefreshToken.deleteOne({ token: incomingRefreshToken });
  // send response Logout Successfully !
  return new ApiResponse(200, "User Logout Successfully").withCookie(
    "refreshToken",
    " ",
  );
});

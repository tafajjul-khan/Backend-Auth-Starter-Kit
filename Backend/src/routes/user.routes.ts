import express, { Router } from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  logoutUser,
  updateUser,
  deleteUser,
  verifyEmail,
  requestVerification,
  generateRefreshAndAccessTokens,
} from "../controller/user.controller.ts";
import {
  validateAccessToken,
} from "../middlewares/auth.middleware.ts";

export const userRouter: Router = express.Router();

userRouter.post("/", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh", generateRefreshAndAccessTokens);
userRouter.post("/logout", logoutUser);
userRouter.get("/all", validateAccessToken, getAllUsers);
userRouter.put("/accountupdate", updateUser);
userRouter.delete("/:id", validateAccessToken, deleteUser);
userRouter.post("/email-verification", validateAccessToken, requestVerification);
userRouter.get("/verify-email", verifyEmail);



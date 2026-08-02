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
} from "../controller/user.controller.ts";
import {
  authenticateJwt,
  AuthenticateedRequest,
} from "../middlewares/auth.middleware.ts";

export const userRouter: Router = express.Router();

userRouter.post("/", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/all", authenticateJwt, getAllUsers);
userRouter.put("/acoountupdate", updateUser);
userRouter.delete("/:id", authenticateJwt, deleteUser);
userRouter.post("/email-verification", authenticateJwt, requestVerification);
userRouter.get("/verify-email", verifyEmail);

// same email old and new
// username if tafajjul khan 123 __ like handle it

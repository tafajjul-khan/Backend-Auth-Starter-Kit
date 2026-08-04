import express, { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  requestVerification,
  generateRefreshAndAccessTokens,
} from "../controller/auth.controller.ts";
import { validateAccessToken } from "../middlewares/auth.middleware.ts";
import { validateData } from "../middlewares/validate.middleware.ts";
import { LoginUserSchema, RegisterUserSchema } from "../validations/auth.validations.ts";

export const authRouter: Router = express.Router();

authRouter.post("/", validateData(RegisterUserSchema), registerUser);
authRouter.post("/login", validateData(LoginUserSchema), loginUser);
authRouter.post("/refresh", generateRefreshAndAccessTokens);
authRouter.post("/logout", logoutUser);
authRouter.post(
  "/email-verification",
  validateAccessToken,
  requestVerification,
);
authRouter.get("/verify-email", verifyEmail);

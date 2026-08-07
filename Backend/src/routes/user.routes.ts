import express, { Router } from "express";
import { validateAccessToken } from "../middlewares/auth.middleware.ts";
import {
  getAllAccount,
  SaveOrUpdateAccount,
  deleteAccount,
  uploadAvatar,
  updateAvatar,
  removeAvatar,
} from "../controller/user.controller.ts";
import { uploadSingleImage } from "../middlewares/upload.middleware.ts";
import { validateData } from "../middlewares/validate.middleware.ts";
import { UserAccountData } from "../validations/user.validations.ts";

export const userRouter: Router = express.Router();

// avatar routes
userRouter.post("/:userId/avatar", uploadSingleImage("avatar"), uploadAvatar);
userRouter.put("/:userId/avatar", uploadSingleImage("avatar"), updateAvatar);
userRouter.delete("/:userId/avatar", removeAvatar);

// account based routes
userRouter.get("/all", validateAccessToken, getAllAccount);
userRouter.post(
  "/create-profile",
  validateAccessToken,
  validateData(UserAccountData),
  SaveOrUpdateAccount,
);
userRouter.delete("/:userId", validateAccessToken, deleteAccount);

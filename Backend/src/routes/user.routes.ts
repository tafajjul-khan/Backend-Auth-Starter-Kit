import express, { Router } from "express";
import { validateAccessToken } from "../middlewares/auth.middleware.ts";
import {
  deleteProfile,
  getAllProfile,
  removeAvatar,
  SaveOrUpdateProfile,
  updateAvatar,
  uploadAvatar,
} from "../controller/user.controller.ts";
import { upload } from "../middlewares/upload.middleware.ts";

export const userRouter: Router = express.Router();

// avatar routes
userRouter.post("/:userId/avatar", upload.single("avatar"), uploadAvatar);
userRouter.put("/:userId/avatar", upload.single("avatar"), updateAvatar);
userRouter.delete("/:userId/avatar", removeAvatar);

// account based routes
userRouter.post("/create-profile", validateAccessToken, SaveOrUpdateProfile);
userRouter.get("/all", validateAccessToken, getAllProfile);
userRouter.post("/update-profile", validateAccessToken, SaveOrUpdateProfile);
userRouter.delete("/:userId", validateAccessToken, deleteProfile);

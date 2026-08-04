import express, { Router } from "express";
import { validateAccessToken } from "../middlewares/auth.middleware.ts";
import { deleteProfile, getAllProfile, SaveOrUpdateProfile } from "../controller/user.controller.ts";

export const userRouter: Router = express.Router();

userRouter.post("/create-profile", validateAccessToken, SaveOrUpdateProfile);
userRouter.get("/all", validateAccessToken, getAllProfile);
userRouter.post("/update-profile", validateAccessToken, SaveOrUpdateProfile);
userRouter.delete("/:id", deleteProfile);

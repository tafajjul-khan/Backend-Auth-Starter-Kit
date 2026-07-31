import express , {Router} from "express"
import { registerUser , loginUser, getAllUsers, logoutUser, updateUser} from "../controller/user.controller.ts"
import {authenticateJwt, AuthenticateedRequest } from "../middlewares/auth.middleware.ts"

export const userRouter:Router = express.Router()

userRouter.post("/", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/logout", logoutUser)
userRouter.get("/all", authenticateJwt, getAllUsers)
userRouter.put("/acoountupdate", updateUser)
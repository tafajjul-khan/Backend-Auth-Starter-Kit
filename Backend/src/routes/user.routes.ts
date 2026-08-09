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



/**
 * @openapi
 * /user/{userId}/avatar:
 *   post:
 *     summary: Upload user profile avatar image
 *     tags: [User Avatar]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload as avatar
 *     responses:
 *       201:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Invalid file format or missing file
 */
userRouter.post("/:userId/avatar", uploadSingleImage("avatar"), uploadAvatar);

/**
 * @openapi
 * /user/{userId}/avatar:
 *   put:
 *     summary: Update or replace existing user avatar
 *     tags: [User Avatar]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: New image file to replace the old avatar
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: Update failed due to invalid file type
 */
userRouter.put("/:userId/avatar", uploadSingleImage("avatar"), updateAvatar);

/**
 * @openapi
 * /user/{userId}/avatar:
 *   delete:
 *     summary: Delete user avatar image
 *     tags: [User Avatar]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *     responses:
 *       200:
 *         description: Avatar removed successfully
 *       404:
 *         description: Avatar not found for this user
 */
userRouter.delete("/:userId/avatar", removeAvatar);

// account based routes

/**
 * @openapi
 * /user/all:
 *   get:
 *     summary: Fetch all registered user accounts
 *     tags: [User Account]
 *     responses:
 *       200:
 *         description: Successfully fetched list of all accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
userRouter.get("/all", getAllAccount);

/**
 * @openapi
 * /user/create-profile:
 *   post:
 *     summary: Save or update full user profile details
 *     tags: [User Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bio
 *               - phoneNumber
 *             properties:
 *               bio:
 *                 type: string
 *                 example: Full Stack Developer passionate about OpenAPI
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               website:
 *                 type: string
 *                 example: https://myportfolio.com
 *     responses:
 *       200:
 *         description: Profile successfully saved or updated
 *       401:
 *         description: Unauthorized. Missing or invalid access token.
 *       400:
 *         description: Profile data failed schema validations
 */
userRouter.post(
  "/create-account",
  validateAccessToken,
  validateData(UserAccountData),
  SaveOrUpdateAccount,
);

/**
 * @openapi
 * /user/{userId}:
 *   delete:
 *     summary: Permanently delete a user account
 *     tags: [User Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the account to delete
 *     responses:
 *       200:
 *         description: Account successfully deleted from the database
 *       401:
 *         description: Unauthorized access token
 *       403:
 *         description: Forbidden. You do not have permissions to delete this account.
 */
userRouter.delete("/:userId", validateAccessToken, deleteAccount);

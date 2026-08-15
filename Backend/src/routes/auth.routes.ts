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
import {
  LoginUserSchema,
  RegisterUserSchema,
} from "../validations/auth.validations.ts";

export const authRouter: Router = express.Router();

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 example: Rahul123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rahul@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data / Validation failed
 */
authRouter.post("/register", validateData(RegisterUserSchema), registerUser);

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Login existing user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rahul@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful. Returns access and refresh tokens.
 *       401:
 *         description: Invalid credentials
 */
authRouter.post("/login", validateData(LoginUserSchema), loginUser);

/**
 * @openapi
 * /refresh:
 *   post:
 *     summary: Generate new access and refresh tokens
 *     description: Expects a valid refresh token in the cookies or body.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
authRouter.post("/refresh", generateRefreshAndAccessTokens);

/**
 * @openapi
 * /logout:
 *   post:
 *     summary: Logout current user
 *     description: Clears cookies or access tokens from session.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
authRouter.post("/logout", logoutUser);

/**
 * @openapi
 * /email-verification:
 *   post:
 *     summary: verify user email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               -email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: userexample@email.com
 *     responses:
 *       201:
 *         description: User email verify successfully
 *       400:
 *         description: Invalid user email
 */
authRouter.post(
  "/email-verification",
  validateAccessToken,
  requestVerification,
);

/**
 * @openapi
 * /verify-email:
 *   get:
 *     summary: Verify user email using token
 *     description: The link clicked from user email lands here.
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token sent via email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
authRouter.get("/verify-email", verifyEmail);

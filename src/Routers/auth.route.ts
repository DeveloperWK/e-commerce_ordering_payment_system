import { Router } from "express";
import AuthController from "../modules/auth/controllers/AuthController";
import LogInRules from "../modules/auth/controllers/AuthValidationMiddleware";

const router = Router();

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User Login
 *     tags: [Login]
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
 *                  type: string
 *               password:
 *                  type: string
 *     responses:
 *       200:
 *         description: Login successful
 */

const authController = new AuthController();
router.post("/login", LogInRules(), authController.login);

export default router;

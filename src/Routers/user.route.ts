import { Router } from "express";
import registrationRules from "../modules/users/controllers/UserValidationMiddleware";
import UserController from "../modules/users/controllers/UserController";

const router = Router();

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone_number
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                  type: string
 *               phone_number:
 *                  type: string
 *               password:
 *                  type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */

const userController = new UserController();
router.post("/register", registrationRules(), userController.register);

export default router;

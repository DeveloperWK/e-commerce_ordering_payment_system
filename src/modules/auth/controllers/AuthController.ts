import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ValidationError } from "../../../shared/Error/errorClass";
import AuthService from "./AuthService";

class AuthController {
	private authService: AuthService;

	constructor() {
		this.authService = new AuthService();
	}

	// Login User
	login = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new ValidationError(errors.array());
			}
			// Authenticate user
			const result = await this.authService.authenticateUser(req.body);

			res.status(200).json({
				success: true,
				message: "Login successful",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	};
}
export default AuthController;

import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { RegisterUserDTO } from "../users.type";
import {
	ConflictError,
	ValidationError,
} from "../../../shared/Error/errorClass";
import UserService from "./UserService";

class UserController {
	private userService: UserService;

	constructor() {
		this.userService = new UserService();
	}

	// Register User
	register = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				throw new ValidationError(errors.array());
			}

			const { name, email, phone_number, password, role }: RegisterUserDTO =
				req.body;

			// Check if email already exists
			const emailExists = await this.userService.checkEmailExists(email);
			if (emailExists) {
				throw new ConflictError("Email already registered");
			}

			// Check if phone number already exists
			const phoneExists = await this.userService.checkPhoneExists(phone_number);
			if (phoneExists) {
				throw new ConflictError("Phone number already registered");
			}

			// Create user
			const user = await this.userService.createUser({
				name,
				email,
				phone_number,
				password,
				role,
			});

			res.status(201).json({
				success: true,
				message: "User registered successfully",
				data: user,
			});
		} catch (error) {
			next(error);
		}
	};
}
export default UserController;

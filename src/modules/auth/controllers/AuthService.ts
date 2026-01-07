import bcrypt from "bcryptjs";
import { configDotenv } from "dotenv";
import jwt from "jsonwebtoken";
import prisma from "../../../shared/config/db.config";
import { UnauthorizedError } from "../../../shared/Error/errorClass";
import type { LogInResponse, LogInUserDTO } from "../auth.type";

configDotenv();
class AuthService {
	async findUserByEmail(email: string) {
		return prisma.users.findUnique({
			where: { email },
		});
	}
	async comparePassword(
		password: string,
		hashedPassword: string,
	): Promise<boolean> {
		return bcrypt.compare(password, hashedPassword);
	}
	generateToken(payload: {
		userId: string;
		email: string;
		role: string;
	}): string {
		const secret = process.env.JWT_SECRET ?? "a-secret-key";
		if (!secret) {
			throw new Error(
				"JWT_SECRET is not defined in environment variables",
			);
		}
		return jwt.sign(payload, secret, { expiresIn: "7D" });
	}
	async authenticateUser(payload: LogInUserDTO): Promise<LogInResponse> {
		const user = await this.findUserByEmail(payload.email);
		if (!user) {
			throw new UnauthorizedError("Invalid email or password");
		}
		const isPasswordValid = await this.comparePassword(
			payload.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new UnauthorizedError("Invalid email or password");
		}
		const userPayload = {
			userId: user.userId,
			email: user.email,
			role: user.role,
		};
		const token = this.generateToken(userPayload);
		return {
			userId: user.userId,
			token,
			role: user.role,
		};
	}
}
export default AuthService;

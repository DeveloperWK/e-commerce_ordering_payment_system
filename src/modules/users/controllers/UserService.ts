import bcrypt from "bcryptjs";
import prisma from "../../../shared/config/db.config";
import type { RegisterUserDTO, UserResponse } from "../users.type";

class UserService {
	async checkEmailExists(email: string): Promise<boolean> {
		const user = await prisma.users.findUnique({
			where: { email },
		});
		return !!user;
	}

	async checkPhoneExists(phone: string): Promise<boolean> {
		const user = await prisma.users.findUnique({
			where: { phone_number: phone },
		});
		return !!user;
	}

	async hashPassword(password: string): Promise<string> {
		const salt = await bcrypt.genSalt(10);
		return bcrypt.hash(password, salt);
	}

	async createUser(userData: RegisterUserDTO): Promise<UserResponse> {
		const hashedPassword = await this.hashPassword(userData.password);

		const user = await prisma.users.create({
			data: {
				name: userData.name,
				email: userData.email,
				phone_number: userData.phone_number,
				password: hashedPassword,
				role: userData.role || "customer",
			},
			select: {
				userId: true,
				name: true,
				email: true,
				phone_number: true,
				role: true,
				created_at: true,
			},
		});

		return user;
	}
}
export default UserService;

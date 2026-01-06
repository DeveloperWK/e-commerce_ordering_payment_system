import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt, { genSalt, hash } from "bcryptjs";
jest.mock("@prisma/client", () => {
	const mockPrismaClient = {
		users: {
			findUnique: jest.fn(),
			create: jest.fn(),
		},
	};
	return {
		PrismaClient: jest.fn(() => mockPrismaClient),
	};
});
jest.mock("bcryptjs", () => ({
	genSalt: jest.fn(),
	hash: jest.fn(),
}));

import UserService from "../UserService";
import UserController from "../UserController";

describe("UserService", () => {
	let userService: UserService;
	let mockPrisma: any;
	beforeEach(() => {
		userService = new UserService();
		mockPrisma = new PrismaClient();
		jest.clearAllMocks();
	});
	describe("checkEmailExists", () => {
		it("should return true if email exists", async () => {
			mockPrisma.users.findUnique.mockResolvedValue({ email: "test@test.com" });
			const result = await userService.checkEmailExists("test@test.com");
			expect(result).toBe(true);
			expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
				where: { email: "test@test.com" },
			});
		});
		it("should return false if email does not exist", async () => {
			mockPrisma.users.findUnique.mockResolvedValue(null);
			const result = await userService.checkEmailExists("nonexistent@test.com");
			expect(result).toBe(false);
		});
	});
	describe("checkPhoneExists", () => {
		it("should return true if phone exists", async () => {
			mockPrisma.users.findUnique.mockResolvedValue({
				phone_number: "01712345678",
			});
			const result = await userService.checkPhoneExists("01712345678");
			expect(result).toBe(true);
			expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
				where: { phone_number: "01712345678" },
			});
		});
		it("should return false if phone does not exist", async () => {
			mockPrisma.users.findUnique.mockResolvedValue(null);
			const result = await userService.checkPhoneExists("01712345678");
			expect(result).toBe(false);
		});
	});
	describe("hashPassword", () => {
		it("should hash password correctly", async () => {
			const password = "Test@1234";
			const hashedPassword = "hashed_password";

			(bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
			(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
			const result = await userService.hashPassword(password);
			expect(result).toBe(hashedPassword);
			expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
			expect(bcrypt.hash).toHaveBeenCalledWith(password, "salt");
		});
	});
	describe("createUser", () => {
		it("should create user successfully", async () => {
			const userData = {
				name: "John Doe",
				email: "john@test.com",
				phone_number: "01712345678",
				password: "Test@1234",
			};
			const mockUser = {
				userId: 1,
				name: "John Doe",
				email: "john@test.com",
				phone_number: "01712345678",
				role: "customer",
				created_at: new Date(),
			};
			(bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
			(bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
			mockPrisma.users.create.mockResolvedValue(mockUser);
			const result = await userService.createUser(userData);
			expect(result).toEqual(mockUser);
			expect(mockPrisma.users.create).toHaveBeenCalledWith({
				data: {
					name: userData.name,
					email: userData.email,
					phone_number: userData.phone_number,
					password: "hashed_password",
					role: "customer",
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
		});
		it("should create user with custom role", async () => {
			const userData = {
				name: "Admin User",
				email: "admin@test.com",
				phone_number: "01712345678",
				password: "Test@1234",
				role: "admin",
			};
			(bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
			(bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
			mockPrisma.users.create.mockResolvedValue({ ...userData, userId: 1 });
			await userService.createUser(userData);
			expect(mockPrisma.users.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						role: "admin",
					}),
				}),
			);
		});
	});
});
describe("UserController", () => {
	let userController: UserController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
	let mockPrisma: any;
	beforeEach(() => {
		userController = new UserController();
		mockPrisma = new PrismaClient();
		mockRequest = {
			body: {},
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
		mockNext = jest.fn();
		jest.clearAllMocks();
	});
	describe("register", () => {
		const validateUser = {
			name: "John Doe",
			email: "john@test.com",
			phone_number: "01712345678",
			password: "Test@1234",
		};
		it("should register user successfully", async () => {
			mockRequest.body = validateUser;
			const mockUser = {
				userId: 1,
				name: "John Doe",
				email: "john@test.com",
				phone_number: "01712345678",
				role: "customer",
				created_at: new Date(),
			};
			jest.mock("express-validator", () => ({
				validationResult: jest.fn().mockReturnValue({
					isEmpty: jest.fn().mockReturnValue(true),
					array: jest.fn().mockReturnValue([]),
				}),
			}));
			mockPrisma.users.findUnique.mockResolvedValue(null);
			(bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
			(bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
			mockPrisma.users.create.mockResolvedValue(mockUser);
			await userController.register(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "User registered successfully",
				data: mockUser,
			});
		});
		it("should throw ConflictError if email already exists", async () => {
			mockRequest.body = validateUser;
			mockPrisma.users.findUnique.mockResolvedValue({
				email: "john@test.com",
			});
			await userController.register(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);
			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "ConflictError",
					message: "Email already registered",
				}),
			);
		});
		it("should throw ConflictError if phone already exists", async () => {
			mockRequest.body = validateUser;

			mockPrisma.users.findUnique
				.mockResolvedValueOnce(null) // email check
				.mockResolvedValueOnce({ phone_number: "01712345678" }); // phone check

			await userController.register(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "ConflictError",
					message: "Phone number already registered",
				}),
			);
		});
		it("should handle database errors", async () => {
			mockRequest.body = validateUser;

			mockPrisma.users.findUnique.mockResolvedValue(null);
			mockPrisma.users.create.mockRejectedValue(new Error("Database error"));

			await userController.register(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
		});
	});
	describe("Integration: UserController with validation", () => {
		it("should validate email format", () => {
			const invalidEmails = [
				"notanemail",
				"@test.com",
				"test@",
				"test..test@test.com",
			];
			invalidEmails.forEach((email) => {
				expect(email).not.toMatch("^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$");
			});
		});
		it("should validate Bangladesh phone number format", () => {
			const validPhones = ["01712345678", "01812345678", "+8801712345678"];
			const invalidPhones = ["12345", "01012345678", "017123456"];

			validPhones.forEach((phone) => {
				expect(phone).toMatch(/^(?:\+88|88)?(01[3-9]\d{8})$/);
			});

			invalidPhones.forEach((phone) => {
				expect(phone).not.toMatch(/^(?:\+88|88)?(01[3-9]\d{8})$/);
			});
		});
	});
});

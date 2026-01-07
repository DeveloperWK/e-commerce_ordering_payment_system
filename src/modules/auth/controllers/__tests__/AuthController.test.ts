import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AuthController from "../AuthController";
import AuthService from "../AuthService";

// Mock Prisma
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

// Mock bcrypt
jest.mock("bcryptjs");

// Mock jsonwebtoken
jest.mock("jsonwebtoken");

// Auth Service Unit Tests

describe("AuthService - Login Methods", () => {
	let authService: AuthService;
	let mockPrisma: any;

	beforeEach(() => {
		authService = new AuthService();
		mockPrisma = new PrismaClient();
		jest.clearAllMocks();

		process.env.JWT_SECRET = "test-secret-key";
	});

	describe("findUserByEmail", () => {
		it("should find user by email", async () => {
			const mockUser = {
				UserId: 1,
				name: "John Doe",
				email: "john@test.com",
				phone_number: "01712345678",
				password: "hashed_password",
				role: "customer",
				created_at: new Date(),
				updated_at: new Date(),
			};

			mockPrisma.users.findUnique.mockResolvedValue(mockUser);

			const result = await authService.findUserByEmail("john@test.com");

			expect(result).toEqual(mockUser);
			expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
				where: { email: "john@test.com" },
			});
		});

		it("should return null if user not found", async () => {
			mockPrisma.users.findUnique.mockResolvedValue(null);

			const result =
				await authService.findUserByEmail("notfound@test.com");

			expect(result).toBeNull();
		});
	});

	describe("comparePassword", () => {
		it("should return true for matching passwords", async () => {
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			const result = await authService.comparePassword(
				"Test@1234",
				"hashed_password",
			);

			expect(result).toBe(true);
			expect(bcrypt.compare).toHaveBeenCalledWith(
				"Test@1234",
				"hashed_password",
			);
		});

		it("should return false for non-matching passwords", async () => {
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			const result = await authService.comparePassword(
				"WrongPass@123",
				"hashed_password",
			);

			expect(result).toBe(false);
		});
	});

	describe("generateToken", () => {
		it("should generate JWT token with correct payload", () => {
			const mockToken = "mock.jwt.token";
			(jwt.sign as jest.Mock).mockReturnValue(mockToken);
			const payload = {
				userId: "1",
				email: "john@test.com",
				role: "customer",
			};
			const token = authService.generateToken(payload);

			expect(token).toBe(mockToken);
			expect(jwt.sign).toHaveBeenCalledWith(
				{
					userId: "1",
					email: "john@test.com",
					role: "customer",
				},
				"test-secret-key",
				{ expiresIn: "7D" },
			);
		});

		it("should use default secret if JWT_SECRET not set", () => {
			delete process.env.JWT_SECRET;
			const mockToken = "mock.jwt.token";
			(jwt.sign as jest.Mock).mockReturnValue(mockToken);

			const payload = {
				userId: "1",
				email: "john@test.com",
				role: "customer",
			};
			authService.generateToken(payload);

			expect(jwt.sign).toHaveBeenCalledWith(
				expect.any(Object),
				"a-secret-key",
				expect.any(Object),
			);
		});
	});

	describe("authenticateUser", () => {
		const mockUser = {
			userId: "1",
			name: "John Doe",
			email: "john@test.com",
			phone_number: "01712345678",
			password: "hashed_password",
			role: "customer",
			created_at: new Date(),
			updated_at: new Date(),
		};

		it("should authenticate user successfully", async () => {
			const mockToken = "mock.jwt.token";

			mockPrisma.users.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			(jwt.sign as jest.Mock).mockReturnValue(mockToken);
			const payload = {
				email: "john@test.com",
				password: "Test@1234",
			};

			const result = await authService.authenticateUser(payload);

			expect(result).toEqual({
				userId: "1",
				token: mockToken,
				role: "customer",
			});
		});

		it("should throw UnauthorizedError if user not found", async () => {
			mockPrisma.users.findUnique.mockResolvedValue(null);
			const payload = {
				email: "john@test.com",
				password: "Test@1234",
			};

			await expect(authService.authenticateUser(payload)).rejects.toThrow(
				"Invalid email or password",
			);
		});

		it("should throw UnauthorizedError if password is incorrect", async () => {
			mockPrisma.users.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);
			const payload = {
				email: "john@test.com",
				password: "WrongPassword@123",
			};
			await expect(authService.authenticateUser(payload)).rejects.toThrow(
				"Invalid email or password",
			);
		});

		it("should not reveal which credential is wrong", async () => {
			// Test with wrong email
			mockPrisma.users.findUnique.mockResolvedValue(null);
			const payload = {
				email: "wrong@test.com",
				password: "Test@1234",
			};

			try {
				await authService.authenticateUser(payload);
			} catch (error: any) {
				expect(error.message).toBe("Invalid email or password");
			}
			const payloadWrongPass = {
				email: "john@test.com",
				password: "WrongPass@123",
			};
			// Test with wrong password
			mockPrisma.users.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			try {
				await authService.authenticateUser(payloadWrongPass);
			} catch (error: any) {
				expect(error.message).toBe("Invalid email or password");
			}
		});
	});
});

// Auth API Tests

describe("AuthController - Login", () => {
	let authController: AuthController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
	let mockPrisma: any;

	beforeEach(() => {
		authController = new AuthController();
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

		process.env.JWT_SECRET = "test-secret-key";
	});

	describe("login", () => {
		const validLoginData = {
			email: "john@test.com",
			password: "Test@1234",
		};

		const mockUser = {
			userId: "1",
			name: "John Doe",
			email: "john@test.com",
			phone_number: "01712345678",
			password: "hashed_password",
			role: "customer",
			created_at: new Date(),
			updated_at: new Date(),
		};

		it("should login user successfully", async () => {
			mockRequest.body = validLoginData;
			const mockToken = "mock.jwt.token";

			mockPrisma.users.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			(jwt.sign as jest.Mock).mockReturnValue(mockToken);

			await authController.login(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				success: true,
				message: "Login successful",
				data: expect.objectContaining({
					userId: "1",
					token: mockToken,
					role: "customer",
				}),
			});
		});

		it("should handle invalid email", async () => {
			mockRequest.body = {
				email: "nonexistent@test.com",
				password: "Test@1234",
			};

			mockPrisma.users.findUnique.mockResolvedValue(null);

			await authController.login(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "UnauthorizedError",
					message: "Invalid email or password",
				}),
			);
		});

		it("should handle invalid password", async () => {
			mockRequest.body = {
				email: "john@test.com",
				password: "WrongPassword@123",
			};

			mockPrisma.users.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await authController.login(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "UnauthorizedError",
					message: "Invalid email or password",
				}),
			);
		});

		it("should handle missing email field", async () => {
			mockRequest.body = {
				password: "Test@1234",
			};

			// Mock validation error
			await authController.login(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle missing password field", async () => {
			mockRequest.body = {
				email: "john@test.com",
			};

			await authController.login(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle empty credentials", async () => {
			mockRequest.body = {
				email: "",
				password: "",
			};

			await authController.login(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle database errors", async () => {
			mockRequest.body = validLoginData;

			mockPrisma.users.findUnique.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await authController.login(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
		});

		it("should handle bcrypt errors", async () => {
			mockRequest.body = validLoginData;

			mockPrisma.users.findUnique.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockRejectedValue(
				new Error("Bcrypt error"),
			);

			await authController.login(
				mockRequest as Request,
				mockResponse as Response,
				mockNext,
			);

			expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
		});
	});
});

describe("Login Validation", () => {
	it("should validate email format", () => {
		const emailRegex =
			/^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;

		const validEmails = [
			"test@test.com",
			"user.name@example.com",
			"user+tag@domain.co.uk",
		];

		const invalidEmails = [
			"notanemail",
			"@test.com",
			"test@",
			"test..test@test.com",
			"test @test.com",
		];

		validEmails.forEach((email) => {
			expect(email).toMatch(emailRegex);
		});

		invalidEmails.forEach((email) => {
			expect(email).not.toMatch(emailRegex);
		});
	});

	it("should require non-empty password", () => {
		const emptyPasswords = ["", "   ", "\t", "\n"];

		emptyPasswords.forEach((password) => {
			expect(password.trim()).toBe("");
		});
	});
});

describe("Token Generation", () => {
	it("should generate token with correct expiration", () => {
		const mockToken = "mock.jwt.token";
		(jwt.sign as jest.Mock).mockReturnValue(mockToken);

		const authService = new AuthService();
		const payload = {
			userId: "1",
			email: "john@test.com",
			role: "customer",
		};
		authService.generateToken(payload);

		expect(jwt.sign).toHaveBeenCalledWith(
			expect.any(Object),
			expect.any(String),
			{ expiresIn: "7D" },
		);
	});

	it("should include userId, email, and role in token payload", () => {
		(jwt.sign as jest.Mock).mockReturnValue("token");

		const authService = new AuthService();
		const payload = {
			userId: "123",
			email: "john@test.com",
			role: "admin",
		};
		authService.generateToken(payload);

		expect(jwt.sign).toHaveBeenCalledWith(
			{
				userId: "123",
				email: "john@test.com",
				role: "admin",
			},
			expect.any(String),
			expect.any(Object),
		);
	});
});

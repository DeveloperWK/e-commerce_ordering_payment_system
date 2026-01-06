import { NextFunction, Request, Response } from "express";
import {
	ConflictError,
	UnauthorizedError,
	ValidationError,
} from "./errorClass";

function ErrorHandler(
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	console.error(err);

	if (err instanceof ValidationError) {
		res.status(400).json({
			success: false,
			message: "Validation failed",
			errors: err.errors.map((e) => ({
				field: e.path || e.param,
				message: e.msg,
			})),
		});
		return;
	}
	if (err instanceof UnauthorizedError) {
		res.status(401).json({
			success: false,
			message: err.message,
		});
		return;
	}
	if (err instanceof ConflictError) {
		res.status(409).json({
			success: false,
			message: err.message,
		});
		return;
	}

	// Prisma unique constraint error
	if (err.name === "PrismaClientKnownRequestError") {
		res.status(409).json({
			success: false,
			message: "A record with this data already exists",
		});
		return;
	}

	res.status(500).json({
		success: false,
		message: "Internal server error",
		error: process.env.NODE_ENV === "development" ? err.message : undefined,
	});
}

export default ErrorHandler;

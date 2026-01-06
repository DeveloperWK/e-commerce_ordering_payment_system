class ValidationError extends Error {
	constructor(public errors: any[]) {
		super("Validation failed");
		this.name = "ValidationError";
	}
}
class ConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ConflictError";
	}
}
class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UnauthorizedError";
	}
}

export { ValidationError, ConflictError, UnauthorizedError };

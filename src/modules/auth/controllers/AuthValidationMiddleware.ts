import { body } from "express-validator";

function LogInRules() {
	return [
		body("email")
			.trim()
			.notEmpty()
			.withMessage("Email is required")
			.isEmail()
			.withMessage("Please provide a valid email")
			.matches(
				/^[a-zA-Z0-9]+([._%+-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/,
			)
			.withMessage("")
			.normalizeEmail(),

		body("password").notEmpty().withMessage("Password is required"),
	];
}

export default LogInRules;

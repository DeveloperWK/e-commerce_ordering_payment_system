import { body } from "express-validator";

function registrationRules() {
	return [
		body("name")
			.trim()
			.notEmpty()
			.withMessage("Name is required")
			.isLength({ min: 2, max: 100 })
			.withMessage("Name must be between 2 and 100 characters")
			.matches(/^[a-zA-Z\s]+$/)
			.withMessage("Name can only contain letters and spaces"),

		body("email")
			.trim()
			.notEmpty()
			.withMessage("Email is required")
			.isEmail()
			.withMessage("Please provide a valid email")
			.normalizeEmail()
			.isLength({ max: 255 })
			.withMessage("Email must not exceed 255 characters"),

		body("phone_number")
			.trim()
			.notEmpty()
			.withMessage("Phone number is required")
			.matches(/^(?:\+88|88)?(01[3-9]\d{8})$/)
			.withMessage("Please provide a valid Bangladesh phone number"),

		body("password")
			.notEmpty()
			.withMessage("Password is required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters long")
			.matches(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
			)
			.withMessage(
				"Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
			),

		body("role")
			.optional()
			.isIn(["customer", "admin", "vendor"])
			.withMessage("Role must be either customer, admin, or vendor"),
	];
}

export default registrationRules;

import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "e-commerce_ordering_payment _system",
			version: "1.0.0",
			description: "API documentation for E-commerce Ordering Payment System",
		},
		servers: [
			{
				url: "http://localhost:3000/api/v1",
				description: "Local server",
			},
		],
	},

	apis: ["./src/Routers/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);

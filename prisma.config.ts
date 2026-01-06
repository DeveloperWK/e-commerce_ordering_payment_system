import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";
import { configDotenv } from "dotenv";
configDotenv();
export default defineConfig({
	schema: path.join("prisma"),
	datasource: {
		url: env("DATABASE_URL"),
	},
});

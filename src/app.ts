import express, { type Application } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import userRoute from "./Routers/user.route";
import authRoute from "./Routers/auth.route";
import morgan from "morgan";
import ErrorHandler from "./shared/Error/errorHandlerMiddaleware";

const app: Application = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1/", userRoute).use("/api/v1", authRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(ErrorHandler);

export default app;

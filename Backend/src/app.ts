import "./config/loadEnv.ts";
import express, { Request, Response, Application } from "express";
import cookieparser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import { swaggerDocs } from "./config/swagger.config.ts";
import { globalErrorHandler } from "./middlewares/errorHandler.middleware.ts";
import morganMiddleware from "./middlewares/morgan.middleware.ts";
import { authRouter } from "./routes/auth.routes.ts";
import { userRouter } from "./routes/user.routes.ts";
import { ApiResponse } from "./utils/apiResponse.ts";

const PORT: number = 3000;
export const app: Application = express();

app.use(cors({ origin: "http://127.0.0.1:5500", credentials: true }));
app.use(express.json());
// morgan middleware
app.use(morganMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

// api endpoints
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/api", authRouter);
app.use("/api", userRouter);

app.get("/api/health", (req:Request,res:Response) => {
    return new ApiResponse(200, "OK")
})



// global error handler
app.use(globalErrorHandler);

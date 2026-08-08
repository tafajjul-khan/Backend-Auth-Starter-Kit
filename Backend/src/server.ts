import "./config/loadEnv.ts";
import cookieparser from "cookie-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerDocs, generateOpenApiJson } from "./config/swagger.config.ts";
import express, { Request, Response, Application } from "express";
import { connectDB } from "./config/connecDB.ts";
import { authRouter } from "./routes/auth.routes.ts";
import { userRouter } from "./routes/user.routes.ts";
import { globalErrorHandler } from "./middlewares/errorHandler.middleware.ts";

const port: number = 3000;
const app: Application = express();
app.use(cors({ origin: "http://127.0.0.1:5500", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

// api endpoints
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.use(globalErrorHandler);
// testing endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "server running",
    api: "http://localhost:3000",
  });
});

// startup
const startServer = async function () {
  await connectDB();
  try {
    app.listen(port, () => {
      console.log(`application listning on http://localhost:${port}`);
      console.log(`📝 Swagger UI: http://localhost:${port}/docs`);
      generateOpenApiJson()
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();

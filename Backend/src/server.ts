import dotenv from "dotenv"
import cookieparser from "cookie-parser"
import express, { Request, Response, Application } from "express";
import { connectDB } from "./config/connecDB.ts";
import { userRouter } from "./routes/user.routes.ts";

dotenv.config()

const port: number = 3000;
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cookieparser())

app.use("/api/user", userRouter)

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "server running",
    api: "http://localhost:3000",
  });
});

const startServer = async function () {
  await connectDB();
  try {
    app.listen(port, () => {
      console.log(`application listning on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error)
  }
};

startServer()


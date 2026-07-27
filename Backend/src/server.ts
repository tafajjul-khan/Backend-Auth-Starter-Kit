import express, { Request, Response, Application } from "express";
import { connectDB } from "./config/connecDB.ts";
import dotenv from "dotenv"

dotenv.config()

const port: number = 3000;
const app: Application = express();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "server running",
    api: "http://localhost:3000",
  });
});

const startServer = async function () {
//   await connectDB();
  try {
    app.listen(port, () => {
      console.log(`application listning on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error)
  }
};

startServer()


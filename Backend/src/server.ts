import express, { Request,Response,Application } from "express";

const port: number = 3000
const app:Application = express()

app.use("/", (req:Request,res: Response) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`application listning on http://localhost:${port}`)
})
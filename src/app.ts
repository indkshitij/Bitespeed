import express from "express";
import cors from "cors";
import identifyRouter from "./routes/identify.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/identify", identifyRouter);

export default app;
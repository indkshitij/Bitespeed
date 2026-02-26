import express from "express";
import cors from "cors";
import identifyRoute from "./routes/identify.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", identifyRoute);

app.get("/", (req, res) => {
  res.send("API Running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
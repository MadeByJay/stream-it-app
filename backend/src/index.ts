import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const port = Number(process.env.port) || 4000;

app.use(express.json());

app.get("/health", (request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/videos", video);

app.listen(port, () => {
  console.log("Listening on port:", port);
});

import express from "express";
import mongoose from "mongoose";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import userRoute from "./routes/user";
import merchantRoute from "./routes/merchant";
import cookieParser from "cookie-parser";

dotenv.config();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority`;

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS to allow requests from http://localhost:3000
const corsOptions: CorsOptions = {
  origin: ["http://localhost:3000", "http://192.168.1.209:3000"],
  credentials: true,
};

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected...");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use("/api", userRoute);
app.use("/api", merchantRoute);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

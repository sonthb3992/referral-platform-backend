import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import userRoute from "./routes/user";

dotenv.config();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority`;

const app = express();
const port = process.env.PORT || 3001;
// Configure CORS to allow requests from http://localhost:3000
const corsOptions = {
  origin: "http://localhost:3000",
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
app.use(express.json());
app.use("/api", userRoute);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

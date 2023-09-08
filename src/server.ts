import express from "express";
import mongoose from "mongoose";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import userRoute from "./routes/user";
import merchantRoute from "./routes/merchant";
import pingRoute from "./routes/ping";
import campaignRoute from "./routes/campaign";
import referralRoute from "./routes/referral";
import checkInRoute from "./routes/checkin";
import cookieParser from "cookie-parser";
import fs from "fs";
import https from "https";

dotenv.config();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority`;

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  "https://caffino-referral-platform.web.app",
  "http://localhost:3000",
];

// Configure CORS to allow requests from http://localhost:3000
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
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
app.use("/api", campaignRoute);
app.use("/api", referralRoute);
app.use("/api", checkInRoute);
app.use("/api", pingRoute);

console.log(process.cwd());

const certificate = fs.readFileSync("src/ssl/certificate.pem", "utf8");
const privateKey = fs.readFileSync("src/ssl/private-key.pem", "utf8");
const credentials = {
  key: privateKey,
  cert: certificate,
};

if (process.env.NODE_ENV === "local") {
  app.listen(port);
}
if (process.env.NODE_ENV === "online") {
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(port, () => {
    console.log(`HTTPS server started on port ${port}`);
  });
}

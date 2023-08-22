import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';


dotenv.config();

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/?retryWrites=true&w=majority`;

const app = express();
const port = process.env.PORT || 3001;

mongoose.connect(uri)
  .then(() => {
    console.log('MongoDB connected...');
  })
  .catch((err) => {
    console.log(err);
  });

app.use(bodyParser.json());
app.use(cors());

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
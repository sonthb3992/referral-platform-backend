import mongoose, { ObjectId, Schema } from "mongoose";

export interface Transaction extends mongoose.Document {
  userId: ObjectId; //member ID of the user whose balance changed
  outletId: ObjectId;
  pointDelta: number; //number of points changed
  content: string; //The reason
}

const transactionSchema = new Schema({
  userId: {
    type: Schema.ObjectId,
    required: true,
    ref: "User",
  },
  outletId: {
    type: Schema.ObjectId,
    required: true,
    ref: "Outlet",
  },
  pointDelta: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

transactionSchema.set("timestamps", true);
const TransactionModel = mongoose.model<Transaction>(
  "Transaction",
  transactionSchema
);
export default TransactionModel;

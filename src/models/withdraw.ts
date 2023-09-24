import mongoose, { Document, Schema, Types } from "mongoose";

export interface WithdrawalRequest extends mongoose.Document {
  user: Schema.Types.ObjectId;
  point: number;
  status: string;
  createAt: Date;
  updateAt: Date;
}

const withdrawalRequestSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    required: true,
    ref: "User",
  },
  point: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
    default: "PENDING",
  },
  createAt: {
    type: Date,
  },
  updateAt: {
    type: Date,
  },
});

withdrawalRequestSchema.set("timestamps", true);
const WithdrawalRequestModel = mongoose.model<WithdrawalRequest>(
  "WithdrawalRequest",
  withdrawalRequestSchema
);
export default WithdrawalRequestModel;

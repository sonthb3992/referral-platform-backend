import mongoose, { Document, Schema, Types } from "mongoose";

export interface RedeemRequest extends mongoose.Document {
  rewardId: Schema.Types.ObjectId;
  code: string;
}

const redeemRequestSchema = new Schema({
  rewardId: {
    type: Schema.ObjectId,
    required: true,
    ref: "Reward",
  },
  code: {
    type: String,
  },
});

redeemRequestSchema.set("timestamps", true);
const RedeemRequestModel = mongoose.model<RedeemRequest>(
  "RedeemRequest",
  redeemRequestSchema
);
export default RedeemRequestModel;

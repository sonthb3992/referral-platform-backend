import mongoose, { Schema } from "mongoose";

export interface Redemption extends mongoose.Document {
  userId?: Schema.Types.ObjectId;
  type: "DISCOUNT_AMOUNT" | "DISCOUNT_PERCENT";
  point: number;
  value: number;
  imageUrl: string;
  isActived: boolean;
}

const redemptionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["DISCOUNT_PERCENT", "DISCOUNT_AMOUNT"],
    default: "DISCOUNT_AMOUNT",
    required: true,
  },
  point: {
    type: Number,
    require: true,
  },
  value: {
    type: Number,
    require: true,
  },
  imageUrl: {
    type: String,
    require: true,
  },
  isActived: {
    type: Boolean,
    require: true,
    default: true,
  },
});

redemptionSchema.set("timestamps", true);
const RedemptionModel = mongoose.model<Redemption>(
  "Redemption",
  redemptionSchema
);
export default RedemptionModel;

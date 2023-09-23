import mongoose, { ObjectId, Schema } from "mongoose";

export interface Reward extends mongoose.Document {
  userId: ObjectId; //member ID of user B
  referralProgramId?: ObjectId;
  promotionProgramId?: ObjectId;
  referredByUserId?: ObjectId; //ID of userA
  expireDate: Date;
  isUsed: boolean;
  isExpired: boolean;
  useDate?: Date;
  usePlace?: ObjectId;
}

const rewardSchema = new Schema({
  userId: {
    type: Schema.ObjectId,
    required: true,
    ref: "User",
  },
  referralProgramId: {
    type: Schema.ObjectId,
    ref: "Referral",
  },
  promotionProgramId: {
    type: Schema.ObjectId,
  },
  referredByUserId: {
    type: Schema.ObjectId,
    ref: "User",
  },
  expireDate: {
    type: Date,
    required: true,
  },
});

rewardSchema.set("timestamps", true);
const RewardModel = mongoose.model<Reward>("Reward", rewardSchema);
export default RewardModel;

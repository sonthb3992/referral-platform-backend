import mongoose, { ObjectId } from "mongoose";

export interface Reward extends mongoose.Document {
  userId: ObjectId; //member ID of user B
  referralProgramId?: ObjectId;
  promotionProgramId?: ObjectId;
  refferedByUserId?: ObjectId; //ID of userA
  expireDate: Date;
}

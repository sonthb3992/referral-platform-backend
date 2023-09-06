import mongoose, { Document, Schema, Types } from "mongoose";

export enum ReferralTypeEnum {
  REFERRING_USER_CODE = "REFERRING_USER_CODE",
  REFERRED_USER_CODE = "REFERRED_USER_CODE",
}

export interface Referral extends Document {
  campaignId: Types.ObjectId;
  codeType: string;
  referringUserID: Types.ObjectId;
  referredUserID: Types.ObjectId | null;
}

const referralSchema = new Schema<Referral>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    codeType: {
      type: String,
      enum: Object.values(ReferralTypeEnum),
      required: true,
    },
    referringUserID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredUserID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "crAt",
      updatedAt: "upAt",
    },
  }
);

const ReferralModel = mongoose.model<Referral>("Referral", referralSchema);

export default  ReferralModel

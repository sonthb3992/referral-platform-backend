import mongoose, { Document, Schema, Types } from "mongoose";

export interface Referral extends Document {
  userId: Schema.Types.ObjectId; //merchant
  name: string;
  description?: string;
  termAndConditions?: string;
  referrerRewardPoint: number;
  referredRewardType: "POINT" | "DISCOUNT" | "FREE_ITEM";
  referredRewardPoint?: number;
  referredDiscountPercentage?: number;
  referredFreeItem?: {
    name: string;
    realValue: number;
    image: string;
  };
  isActived: boolean;
  maxParticipants?: number;
  participantsCount: number;
  daysToRedeem: number;
  campaignImage: string;
  startDate: Date;
  endDate?: Date;
  minSpend?: number;
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface ReferralProgramQRCode {
  referrerId?: string;
  campaignId?: string;
  code?: string;
}

const referralSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  termAndConditions: {
    type: String,
  },
  referrerRewardPoint: {
    type: Number,
    required: true,
  },
  referredRewardType: {
    type: String,
    enum: ["POINT", "DISCOUNT", "FREE_ITEM"],
    required: true,
  },
  referredRewardPoint: {
    type: Number,
  },
  referredDiscountPercentage: {
    type: Number,
  },
  referredFreeItem: {
    name: String,
    realValue: Number,
    image: String,
  },
  isActived: {
    type: Boolean,
    required: true,
  },
  maxParticipants: {
    type: Number,
  },
  participantsCount: {
    type: Number,
    required: true,
  },
  daysToRedeem: {
    type: Number,
    required: true,
  },
  campaignImage: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  minSpend: {
    type: Number,
  },
  timestamps: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
});

referralSchema.set("timestamps", true);
const ReferralModel = mongoose.model<Referral>("Referral", referralSchema);
export default ReferralModel;

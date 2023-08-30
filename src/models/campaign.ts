import mongoose, { Schema } from "mongoose";

export interface Campaign extends mongoose.Document {
  userId: Schema.Types.ObjectId;
  name: string;
  description: string;
  termsAndConditions: string;
  type: "Promotion" | "Referral";
  startDate: Date;
  endDate: Date;
  outlets: Schema.Types.ObjectId[]; // List of outlet IDs
  minQuantity: number; // Minimum quantity required for the campaign
  maxQuantity: number; // Maximum quantity allowed for the campaign
  value: number; // Point or money value associated with the campaign
  referrerReward: number;
  referralReward: number;
  active: boolean; // Whether the campaign is currently active
  redemptionMethod: string; // Method for customers to redeem the campaign
  maxParticipants: number; // Maximum number of participants allowed
  categories: string[]; // Categories or tags for campaign categorization
  targetAudience: string; // Target audience description
  priority: number; // Priority level for campaign display order
  campaignImage: string; // URL to the campaign image
}

const campaignSchema: Schema<Campaign> = new Schema<Campaign>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String, required: true },
  termsAndConditions: { type: String, required: true },
  type: { type: String, enum: ["Promotion", "Referral"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  outlets: [{ type: Schema.Types.ObjectId, ref: "Outlet" }],
  minQuantity: { type: Number, default: 0 },
  maxQuantity: { type: Number, default: 1 },
  value: { type: Number, required: true },
  referrerReward: { type: Number, required: true },
  referralReward: { type: Number, required: true },
  active: { type: Boolean, default: true },
  redemptionMethod: { type: String },
  maxParticipants: { type: Number },
  categories: [{ type: String }],
  targetAudience: { type: String },
  priority: { type: Number },
  campaignImage: { type: String },
});

const CampaignModel = mongoose.model<Campaign>("Campaign", campaignSchema);

export default CampaignModel;

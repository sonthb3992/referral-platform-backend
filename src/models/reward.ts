import { isBefore } from "date-fns";
import mongoose, { ObjectId, Schema } from "mongoose";
import { User, UserModel } from "./user";
import ReferralModel, { Referral } from "./referral";
import RedemptionModel, { Redemption } from "./redemption";
import OutletModel, { Outlet } from "./outlet";

export interface RewardInfo {
  reward: Reward;
  owner: User;
  campaign?: Referral;
  outlets: Outlet[];
  referrer?: User;
  redemption?: Redemption;
}

export interface RewardItem {
  userId: Schema.Types.ObjectId;
  rewardType: "POINT" | "DISCOUNT_PERCENT" | "DISCOUNT_AMOUNT";
  rewardValue: number;
  source: "REFERRER" | "REFERRED" | "REDEEM";
}

export interface Reward extends mongoose.Document {
  userId: Schema.Types.ObjectId; //member ID of user B
  campaignId?: Schema.Types.ObjectId; //member ID of user B
  redemptionId?: Schema.Types.ObjectId;
  referredByUserId?: Schema.Types.ObjectId; //ID of userA
  expireDate: Date;
  isUsed: boolean;
  useDate?: Date;
  usePlace?: Schema.Types.ObjectId;
  rewards: RewardItem[];
}

const rewardSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: "Referral",
  },
  redemptionId: {
    type: Schema.Types.ObjectId,
    ref: "Redemption",
  },
  referredByUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  expireDate: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  useDate: {
    type: Date,
    required: false,
  },
  usePlace: {
    type: Schema.Types.ObjectId,
    ref: "Outlet",
  },
  rewards: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
      rewardType: {
        type: String,
        required: true,
        enum: ["POINT", "DISCOUNT_PERCENT", "DISCOUNT_AMOUNT"],
      },
      rewardValue: {
        type: Number,
        required: true,
      },
      source: {
        type: String,
        enum: ["REFERRER", "REFERRED", "REDEEM"],
        required: true,
      },
    },
  ],
});

rewardSchema.set("timestamps", true);
const RewardModel = mongoose.model<Reward>("Reward", rewardSchema);
export default RewardModel;

// Function to check if a reward is expired
const isRewardExpired = (reward: Reward): boolean => {
  return reward.isUsed || isBefore(new Date(reward.expireDate), new Date());
};

// Function to retrieve reward owner
const getRewardOwner = async (reward: Reward): Promise<User | null> => {
  return await UserModel.findById(reward.userId);
};

// Function to retrieve reward campaign information
const getRewardCampaign = async (
  reward: Reward
): Promise<{ campaign: Referral; outlets: Outlet[] } | null> => {
  if (reward.campaignId) {
    const campaign = await ReferralModel.findById(reward.campaignId);
    if (!campaign) return null;
    const outlets = await OutletModel.find({ userId: campaign.userId });
    return { campaign, outlets };
  }
  return null;
};

// Function to retrieve referrer information
const getReferrer = async (reward: Reward): Promise<User | null> => {
  if (reward.referredByUserId) {
    return await UserModel.findById(reward.referredByUserId);
  }
  return null;
};

// Function to retrieve redemption information
const getRedemption = async (reward: Reward): Promise<Redemption | null> => {
  if (reward.redemptionId) {
    return await RedemptionModel.findById(reward.redemptionId);
  }
  return null;
};

// Main function to get detailed reward information
export const getRewardInfo = async (
  rewardId: string
): Promise<Error | RewardInfo> => {
  try {
    const reward = await RewardModel.findById(rewardId);
    if (!reward) {
      throw new Error("Reward not found");
    }

    if (isRewardExpired(reward)) {
      throw new Error("This reward has been used or expired.");
    }

    const owner = await getRewardOwner(reward);
    if (!owner) {
      throw new Error("Reward owner not found.");
    }

    const campaignWithOutlets = await getRewardCampaign(reward);
    const referrer = await getReferrer(reward);
    const redemption = await getRedemption(reward);

    const result: RewardInfo = {
      reward,
      owner,
      campaign: campaignWithOutlets?.campaign,
      outlets: campaignWithOutlets?.outlets,
      referrer,
      redemption,
    };

    return result;
  } catch (error) {
    return error;
  }
};

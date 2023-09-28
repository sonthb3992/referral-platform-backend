import express, { Request, Response, NextFunction, request } from "express";
import { User, UserModel } from "../models/user";
import ReferralModel, { Referral } from "../models/referral";
import { verifyToken, authorize } from "../middlewares/authentication";
import RewardModel from "../models/reward";
import mongoose from "mongoose";
import { getOutletOfUserId } from "./merchant";
import RedeemRequestModel from "../models/redeemRequest";
import { add, addMinutes, isBefore } from "date-fns";
import { generateCode } from "../utils/code";
import CheckInModel from "../models/checkin";
import TransactionModel from "../models/transaction";
import OutletModel from "../models/outlet";

const router = express.Router();

const getRewardById = async (
  rewardId: string
): Promise<
  | Error
  | {
      reward: mongoose.Document<
        unknown,
        {},
        import("e:/6. Source/repos/referral-platform-backend/src/models/reward").Reward
      > &
        import("e:/6. Source/repos/referral-platform-backend/src/models/reward").Reward & {
          _id: mongoose.Types.ObjectId;
        };
      campaign: mongoose.Document<unknown, {}, Referral> &
        Referral & { _id: mongoose.Types.ObjectId };
      referrer: any;
      owner: mongoose.Document<unknown, {}, User> &
        User & { _id: mongoose.Types.ObjectId };
    }
> => {
  const reward = await RewardModel.findById(rewardId);
  if (!reward) {
    return new Error("Reward not found");
  }
  if (reward.isUsed || isBefore(new Date(reward.expireDate), new Date())) {
    return new Error("This reward had been used or expired.");
  }
  const campaign = await ReferralModel.findById(reward.referralProgramId);
  if (!campaign) {
    return new Error("Campaign not found");
  }
  if (!campaign.isActived) {
    return new Error("Campaign disabled");
  }
  if (
    campaign.maxParticipants &&
    campaign.maxParticipants <= campaign.participantsCount
  ) {
    return new Error("Max participants reached");
  }
  if (campaign.endDate && isBefore(new Date(campaign.endDate), new Date())) {
    return new Error("Campaign expired");
  }

  const checkIn = CheckInModel.findOne({
    businessId: campaign.userId,
    userId: reward.userId,
  });
  if (checkIn) {
    return new Error("Only applied to new customers");
  }

  let referrer = undefined;
  if (reward.referredByUserId) {
    referrer = await UserModel.findById(reward.referredByUserId);
    if (!referrer) {
      return new Error("Referrer not found");
    }
  }

  const rewardOwner = await UserModel.findById(reward.userId);
  return { reward, campaign, referrer, owner: rewardOwner };
};

router.get(
  "/reward",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      var query = { userId: req.userId, isUsed: false };
      const rewards = await RewardModel.find(query);

      if (!rewards) {
        return res.status(400).json({ error: "Promotion program not found." });
      }
      const progPromises = rewards.map(async (reward) => {
        const prog = await ReferralModel.findById(reward.referralProgramId);
        return {
          reward: reward,
          campaign: prog,
        };
      });

      const rewardsWithCampaign = await Promise.all(progPromises);
      const outletPromises = rewardsWithCampaign.map(
        async (rewardsWithCampaign) => {
          const outlets = await getOutletOfUserId(
            rewardsWithCampaign.campaign.userId
          );
          return {
            reward: rewardsWithCampaign.reward,
            campaign: rewardsWithCampaign.campaign,
            outlets: outlets,
          };
        }
      );

      const result = await Promise.all(outletPromises);

      res.status(200).json({ result });
    } catch (error) {
      res.status(500).json({
        error: "An error occurred while retrieving the referral program.",
      });
      console.error("Error retrieving referral program:", error);
      next(error);
    }
  }
);

router.get(
  "/reward/verifyCode/:code",
  verifyToken,
  authorize(["BUSINESS_OWNER", "BUSINESS_STAFF", "ADMIN"]),
  async (req: Request, res, next) => {
    try {
      const code = req.params.code;
      if (!code) {
        return res.status(400).json({ error: "Required field is missing." });
      }

      const request = await RedeemRequestModel.findOne({ code: code });
      if (!request) {
        return res.status(400).json({ error: "Invalid code." });
      }
      const codeExpireTime = addMinutes(new Date(request.updateAt), 5);
      if (isBefore(codeExpireTime, new Date())) {
        if (!request) {
          return res.status(400).json({ error: "Code is expired." });
        }
      }
      const result = await getRewardById(request.rewardId.toString());
      if (result instanceof Error) {
        return res.status(400).json({ error: result.message });
      }
      res.status(200).json({ ...result });
    } catch (error) {
      res.status(500).json({
        error: "An error occurred while retrieving the referral program.",
      });
      console.error("Error retrieving referral program:", error);
      next(error);
    }
  }
);

router.get(
  "/reward/:rewardId",
  verifyToken,
  authorize(["BUSINESS_OWNER", "BUSINESS_STAFF", "ADMIN"]),
  async (req: Request, res, next) => {
    try {
      const rewardId = req.params.rewardId;
      if (!rewardId) {
        return res.status(400).json({ error: "Required field is missing." });
      }
      const result = await getRewardById(rewardId);
      if (result instanceof Error) {
        return res.status(400).json({ error: result.message });
      }
      console.log(result);
      res.status(200).json({ ...result });
    } catch (error) {
      res.status(500).json({
        error: "An error occurred while retrieving the referral program.",
      });
      console.error("Error retrieving referral program:", error);
      next(error);
    }
  }
);

router.post(
  "/redeem/request",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rewardId } = req.body;

      // Check if rewardId is provided
      if (!rewardId) {
        return res.status(400).json({ error: "RewardId is required." });
      }

      const reward = await RewardModel.findOne({
        userId: req.userId,
        _id: rewardId,
      });

      if (!reward) {
        return res.status(400).json({ error: "Invalid reward data." });
      }

      if (reward.isUsed || isBefore(new Date(reward.expireDate), new Date())) {
        return res
          .status(400)
          .json({ error: "This reward had been used or expired." });
      }

      const existingRequest = await RedeemRequestModel.findOne({
        rewardId: rewardId,
      });
      const newCode = generateCode(rewardId, new Date().getTime().toString());

      if (existingRequest) {
        // If the request exists, generate a new code and update the existing request
        existingRequest.code = newCode;
        await existingRequest.save();
        return res.status(200).json({ code: newCode });
      }

      const newRequest = new RedeemRequestModel({
        rewardId: reward._id,
        code: newCode,
      });

      await newRequest.save();

      return res.status(200).json({ code: newCode });
    } catch (error) {
      console.error("Error requesting redeem:", error);
      return res
        .status(500)
        .json({ error: "An error occurred while requesting redeem." });
    }
  }
);

router.post(
  "/reward/save",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { campaignId, referrerId, code } = req.body;
      if (!campaignId || !referrerId || !code) {
        return res.status(400).json({ error: "RewardId is required." });
      }

      const evaluateCode = generateCode(
        campaignId,
        req.userId.toString(),
        referrerId
      );
      if (code !== evaluateCode) {
        return res.status(400).json({ error: "Invalid reward data." });
      }
      const newReward = new RewardModel({
        userId: req.userId,
        referralProgramId: campaignId,
        referredByUserId: referrerId,
      });
      const refProg = await ReferralModel.findById(campaignId);
      if (!refProg) {
        return res.status(404).json({ error: "Campaign not found." });
      }

      const currentDate = new Date();
      const futureDate = add(currentDate, { days: refProg.daysToRedeem });
      if (refProg.endDate === undefined) {
        newReward.expireDate = add(currentDate, { days: refProg.daysToRedeem });
      } else {
        const progEndDate = new Date(refProg.endDate);
        newReward.expireDate = isBefore(futureDate, progEndDate)
          ? futureDate
          : progEndDate;
      }

      await newReward.save();
      return res.status(201).json({ message: "success" });
    } catch (error) {
      console.error("Error requesting redeem:", error);
      return res
        .status(500)
        .json({ error: "An error occurred while requesting redeem." });
    }
  }
);

router.post(
  "/redeem/complete",
  verifyToken,
  authorize(["BUSINESS_OWNER", "BUSINESS_STAFF"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rewardId, outletId } = req.body;
      if (!rewardId || !outletId) {
        return res.status(400).json({ error: "Missing required field(s)." });
      }
      const rewardInfo = await getRewardById(rewardId);
      if (rewardInfo instanceof Error) {
        return res.status(400).json({ error: rewardInfo.message });
      }
      const outlet = await OutletModel.findById(outletId);
      if (!outlet) {
        return res.status(404).json({ error: "Outlet not found" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      const checkIn = new CheckInModel({
        outletId: outletId,
        userId: rewardInfo.owner._id,
        businessId: outlet.userId,
        consents: [],
        visitCount: 1,
      });
      await checkIn.save({ session });

      //Update
      await RewardModel.findOneAndUpdate(
        { _id: rewardId },
        {
          isUsed: true,
          usePlace: outletId,
          useDate: new Date(),
        }
      ).session(session);

      //Add points to user A
      await UserModel.findOneAndUpdate(
        { _id: rewardInfo.referrer._id },
        {
          point:
            rewardInfo.referrer.point + rewardInfo.campaign.referrerRewardPoint,
        }
      ).session(session);
      const transUserA = new TransactionModel({
        userId: rewardInfo.owner._id,
        outletId: outletId,
        pointDelta: rewardInfo.campaign.referrerRewardPoint,
        content: `Earn points from referral program ${rewardInfo.campaign.name}`,
      });
      await transUserA.save({ session });

      //Charge points from store's balance
      await UserModel.findOneAndUpdate(
        { _id: rewardInfo.campaign.userId },
        {
          point:
            rewardInfo.referrer.point - rewardInfo.campaign.referrerRewardPoint,
        }
      ).session(session);
      const transShop = new TransactionModel({
        userId: rewardInfo.campaign.userId,
        outletId: outletId,
        pointDelta: -rewardInfo.campaign.referrerRewardPoint,
        content: `Redeem points for referral program ${rewardInfo.campaign.name}`,
      });
      await transShop.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error redeem:", error);
      return res.status(500).json({ error: "An error occurred while redeem." });
    }
  }
);

export default router;

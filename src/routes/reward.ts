import express, { Request, Response, NextFunction, request } from "express";
import { User, UserModel } from "../models/user";
import ReferralModel, { Referral } from "../models/referral";
import { verifyToken, authorize } from "../middlewares/authentication";
import RewardModel, {
  Reward,
  RewardInfo,
  RewardItem,
  getRewardInfo,
} from "../models/reward";
import mongoose, { ClientSession } from "mongoose";
import RedeemRequestModel from "../models/redeemRequest";
import { add, addDays, addMinutes, isBefore } from "date-fns";
import { generateCode } from "../utils/code";
import CheckInModel from "../models/checkin";
import TransactionModel from "../models/transaction";
import OutletModel, { Outlet } from "../models/outlet";
import RedemptionModel, { Redemption } from "../models/redemption";

const router = express.Router();

router.get(
  "/reward",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      var query = { userId: req.userId, isUsed: false };
      const rewards = await RewardModel.find(query);

      console.log(rewards);
      res.status(200).json({ rewards });
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
      const result = await getRewardInfo(request.rewardId.toString());
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
  authorize(["CUSTOMER", "BUSINESS_OWNER", "BUSINESS_STAFF", "ADMIN"]),
  async (req: Request, res, next) => {
    try {
      const rewardId = req.params.rewardId;
      if (!rewardId) {
        return res.status(400).json({ error: "Required field is missing." });
      }
      const result = await getRewardInfo(rewardId);
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

      const campaign = await ReferralModel.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found." });
      }

      const checkIn = await CheckInModel.findOne({
        businessId: campaign.userId,
        userId: req.userId.toString(),
      });
      if (checkIn) {
        console.log({ checkIn });
        return res
          .status(400)
          .json({ error: "Applied to new customers only." });
      }

      const newReward = new RewardModel({
        userId: req.userId,
        campaignId: campaignId,
        referredByUserId: referrerId,
      });
      const refProg = await ReferralModel.findById(campaignId);
      if (!refProg) {
        return res.status(404).json({ error: "Campaign not found." });
      }
      let rewards: RewardItem[] = [];
      rewards.push({
        rewardType: "POINT",
        source: "REFERRER",
        userId: referrerId,
        rewardValue: refProg.referrerRewardPoint,
      });
      rewards.push({
        rewardType: refProg.referredRewardType,
        source: "REFERRED",
        userId: req.userId as any,
        rewardValue: refProg.referredRewardValue,
      });
      newReward.rewards = rewards;
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

const updateCheckIn = async (
  session: ClientSession,
  rewardInfo: RewardInfo,
  outlet: Outlet
) => {
  const filter = {
    userId: rewardInfo.owner._id,
    outletId: outlet._id,
  };

  const update = {
    $inc: { visitCount: 1 },
    $setOnInsert: {
      outletId: outlet._id,
      userId: rewardInfo.owner._id,
      businessId: outlet.userId,
      consents: [],
      visitCount: 1,
    },
  };

  const options = {
    upsert: true,
    new: true, // Return the updated document if it exists, or the new one if created
    session: session,
  };

  await CheckInModel.findOneAndUpdate(filter, update, options);
};

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
      const rewardInfo = await getRewardInfo(rewardId);
      if (rewardInfo instanceof Error) {
        return res.status(400).json({ error: rewardInfo.message });
      }
      const outlet = await OutletModel.findById(outletId);
      if (!outlet) {
        return res.status(404).json({ error: "Outlet not found" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      await updateCheckIn(session, rewardInfo, outlet);

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
      const rewardItems = (rewardInfo.reward as Reward).rewards;

      for (const item of rewardItems) {
        if (item.rewardType !== "POINT") {
          continue; // Skip non-POINT rewards
        }
        await UserModel.findOneAndUpdate(
          { _id: item.userId },
          {
            $inc: { point: item.rewardValue },
          }
        ).session(session);

        // Create a transaction entry
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
            $inc: {
              point: -item.rewardValue,
            },
          }
        ).session(session);
        const transShop = new TransactionModel({
          userId: rewardInfo.campaign.userId,
          outletId: outletId,
          pointDelta: -item.rewardValue,
          content: `Redeem points for referral program ${rewardInfo.campaign.name}`,
        });
        await transShop.save({ session });
      }

      // Commit the transaction
      await session.commitTransaction();
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error redeem:", error);
      return res.status(500).json({ error: "An error occurred while redeem." });
    }
  }
);

router.post(
  "/voucher",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { redemptionId } = req.body;

      if (!redemptionId) {
        return res.status(400).json({ error: "Missing required field(s)." });
      }
      const redemption = await RedemptionModel.findById(redemptionId);
      if (!redemption) {
        return res.status(404).json({ error: "Redemption not found." });
      }
      const session = await mongoose.startSession();
      session.startTransaction();
      //Update
      //Decrease points to user A
      await UserModel.findOneAndUpdate(
        { _id: req.userId },
        {
          $inc: { point: -redemption.point },
        }
      ).session(session);

      const newReward = new RewardModel({
        userId: req.userId,
        expireDate: addDays(new Date(), 30),
        redemptionId: redemptionId,
      });

      let rewards: RewardItem[] = [];
      rewards.push({
        rewardType: "DISCOUNT_AMOUNT",
        source: "REDEEM",
        userId: req.userId as any,
        rewardValue: redemption.value,
      });
      newReward.rewards = rewards;
      await newReward.save({ session });
      const transaction = new TransactionModel({
        userId: req.userId,
        pointDelta: -redemption.point,
        content: "Vourcher exchange",
      });
      await transaction.save({ session });
      await session.commitTransaction();
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error redeem:", error);
      return res.status(500).json({ error: "An error occurred while redeem." });
    }
  }
);

export default router;

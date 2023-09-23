import express, { Request, Response, NextFunction } from "express";
import admin from "../firebase/admin";
import { UserModel, customerAuthorizedRoles } from "../models/user";
import ReferralModel, { Referral } from "../models/referral";
import { verifyToken, authorize } from "../middlewares/authentication";
import { MD5 } from "crypto-js";
import RewardModel from "../models/reward";
import { Schema } from "mongoose";
import { Outlet } from "../models/outlet";
import { getOutletOfUserId } from "./merchant";
import { generateCode } from "./referral";
import RedeemRequestModel from "../models/redeemRequest";

const router = express.Router();

router.get(
  "/reward",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      var query: any = { userId: req.userId };
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
  "/reward/:rewardId",
  verifyToken,
  authorize(["BUSINESS_OWNER", "BUSINESS_STAFF", "ADMIN"]),
  async (req: Request, res, next) => {
    try {
      const rewardId = req.params.rewardId;
      if (!rewardId) {
        return res.status(400).json({ error: "Required field is missing." });
      }

      const reward = await RewardModel.findById(rewardId);
      if (!reward) {
        return res.status(400).json({ error: "Reward not found." });
      }
      const campaign = await ReferralModel.findById(reward.referralProgramId);
      if (!campaign) {
        return res.status(400).json({ error: "Referral program not found." });
      }
      if (!campaign.isActived) {
        return res.status(400).json({ error: "Referral program is disabled." });
      }
      if (
        campaign.maxParticipants &&
        campaign.maxParticipants <= campaign.participantsCount
      ) {
        return res.status(400).json({ error: "Max participants reached." });
      }
      if (campaign.endDate) {
        return res.status(400).json({ error: "The program is expired." });
      }
      const outlets = await getOutletOfUserId(campaign.userId);
      res.status(200).json({ reward, campaign, outlets });
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
  "/requestRedeem",
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

      if (reward.isUsed || reward.isExpired) {
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

// router.post(
//   "/saveReward",
//   verifyToken,
//   authorize(["CUSTOMER"]),
//   async (req: Request, res, next) => {
//     try {
//       const formData: Outlet = req.body;
//       if (!formData.name || !formData.address) {
//         return res.status(400).json({ error: "Required field is missing." });
//       }

//       // Check if an outlet with the same user and name (case-insensitive) already exists
//       const existingOutlet = await OutletModel.findOne({
//         userId: req.user._id,
//         name: { $regex: new RegExp(`^${formData.name}$`, "i") },
//       });

//       if (existingOutlet) {
//         return res
//           .status(409)
//           .json({ error: "Outlet with same name already exists." });
//       }

//       // Create a new outlet
//       const newOutlet = new OutletModel({
//         userId: req.user._id,
//         name: formData.name,
//         address: formData.address ?? "",
//         phone: formData.phone,
//         desc: formData.desc,
//         imageUrl: formData.imageUrl,
//       });

//       await newOutlet.save();

//       res
//         .status(201)
//         .json({ message: "Outlet created successfully.", outlet: newOutlet });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "An error occurred while creating the outlet." });
//       console.error("Error creating outlet:", error);
//       next(error);
//     }
//   }
// );

export default router;

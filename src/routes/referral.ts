import express, { Request, Response, NextFunction } from "express";
import admin from "../firebase/admin";
import { UserModel, customerAuthorizedRoles } from "../models/user";
import ReferralModel, { Referral, ReferralTypeEnum } from "../models/referral";
import CampaignModel, { Campaign } from "../models/campaign";
import { verifyToken, authorize} from "../middlewares/authentication";

const router = express.Router();

router.post(
  "/referring",
  verifyToken,
  authorize(customerAuthorizedRoles),
  async (req: Request, res: Response, next: NextFunction) => {
    // Destructure the fields from the request body
    const { campaignId } = req.body as { campaignId: string };

    try {
      // Check validate the campaignId
      const campaign = await CampaignModel.findById(campaignId);
      if (!campaign) {
        return res.status(400).json({
          message: "Invalid Campaign Id",
        });
      }

      // Create the new Referral object
      const newReferral = new ReferralModel({
        campaignId: campaignId,
        codeType: ReferralTypeEnum.REFERRING_USER_CODE,
        referringUserID: req.user._id,
      });

      // Save the new referral to the database
      await newReferral.save();

      res.status(201).json({
        message: "User code created successfully",
        referral: newReferral,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

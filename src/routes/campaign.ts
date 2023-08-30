import express from "express";
import admin from "../firebase/admin";
import { UserModel, businessOwnerAuthorizedRoles } from "../models/user";
import { Request } from "../types/custom";
import {
  authorize,
  createToken,
  verifyToken,
} from "../middlewares/authentication";
import CampaignModel, { Campaign } from "../models/campaign";

const router = express.Router();

router.post(
  "/campaign",
  verifyToken,
  authorize(businessOwnerAuthorizedRoles),
  async (req: Request, res, next) => {
    try {
      const formData: Campaign = req.body;
      if (
        !formData.name ||
        !formData.description ||
        !formData.termsAndConditions
      ) {
        return res.status(400).json({ error: "Required fields are missing." });
      }

      // Create a new campaign
      const newCampaign = new CampaignModel({
        userId: req.user._id,
        name: formData.name,
        description: formData.description,
        termsAndConditions: formData.termsAndConditions,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        outlets: formData.outlets || [],
        minQuantity: formData.minQuantity || 0,
        maxQuantity: formData.maxQuantity || 1,
        value: formData.value,
        active: formData.active || true,
        redemptionMethod: formData.redemptionMethod || "",
        maxParticipants: formData.maxParticipants || undefined,
        categories: formData.categories || [],
        targetAudience: formData.targetAudience || "",
        priority: formData.priority || undefined,
        campaignImage: formData.campaignImage || "",
      });

      await newCampaign.save();

      res.status(201).json({
        message: "Campaign created successfully.",
        campaign: newCampaign,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while creating the campaign." });
      console.error("Error creating campaign:", error);
      next(error);
    }
  }
);

router.get(
  "/campaign",
  verifyToken,
  authorize(businessOwnerAuthorizedRoles),
  async (req: Request, res, next) => {
    try {
      const userId = req.user._id;
      const { active } = req.query; // Check if "active" query parameter is provided

      let campaigns;
      if (active === "true") {
        campaigns = await CampaignModel.find({ userId, active: true });
      } else {
        campaigns = await CampaignModel.find({ userId });
      }

      res.status(200).json({ campaigns });
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while fetching campaigns." });
      console.error("Error fetching campaigns:", error);
      next(error);
    }
  }
);

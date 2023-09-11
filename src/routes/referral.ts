import express, { Request, Response, NextFunction } from "express";
import admin from "../firebase/admin";
import { UserModel, customerAuthorizedRoles } from "../models/user";
import ReferralModel, { Referral } from "../models/referral";
import { verifyToken, authorize } from "../middlewares/authentication";

const router = express.Router();

router.post(
  "/referralProgram",
  verifyToken,
  authorize(["BUSINESS_OWNER", "ADMIN"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const prog: Partial<Referral> = req.body;
    try {
      // Check if a referral program already exists for the user
      const existingProgram = await ReferralModel.findOne({ userId });
      if (existingProgram) {
        // Update the existing program with the new data
        Object.assign(existingProgram, prog);

        // Save the updated program
        await existingProgram.save();

        res.status(200).json(existingProgram);
      } else {
        // If no program exists, create a new one
        const newProgram = new ReferralModel({
          userId,
          ...prog,
        });

        // Save the new program
        await newProgram.save();

        res.status(201).json(newProgram);
      }
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/referralProgram/:userId",
  verifyToken,
  async (req: Request, res, next) => {
    try {
      const userId = req.params.userId;

      // Find the referral program for the logged-in user
      const referralProgram = await ReferralModel.findOne({ userId });

      if (!referralProgram) {
        return res.status(200).json([]);
      }

      res.status(200).json({ referralProgram });
    } catch (error) {
      res.status(500).json({
        error: "An error occurred while retrieving the referral program.",
      });
      console.error("Error retrieving referral program:", error);
      next(error);
    }
  }
);

// router.get(
//   "/referral/:referralId",
//   verifyToken,
//   authorize(customerAuthorizedRoles),
//   async (req: Request, res: Response, next: NextFunction) => {
//     // Destructure the fields from the request body
//     const { referralId } = req.params as { referralId: string };

//     try {
//       // Check validate the referralId
//       const referral = await ReferralModel.findById(referralId);
//       if (!referral) {
//         return res.status(400).json({
//           message: "Invalid Referral Id",
//         });
//       }

//       const campaign = await CampaignModel.findById(referral.campaignId);
//       if (!campaign) {
//         return res.status(400).json({
//           message: "Invalid Campaign Id",
//         });
//       }

//       res.status(200).json({
//         message: "Referral retrieved successfully",
//         referral: referral,
//         campaign: campaign,
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

export default router;

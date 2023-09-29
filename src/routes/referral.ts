import express, { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user";
import ReferralModel, {
  Referral,
  ReferralProgramQRCode,
} from "../models/referral";
import { verifyToken, authorize } from "../middlewares/authentication";
import RewardModel from "../models/reward";
import { isBefore } from "date-fns";
import { generateCode } from "../utils/code";
import CheckInModel from "../models/checkin";

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
        delete prog._id;
        const newProgram = new ReferralModel({
          ...prog,
          userId: userId,
        });
        console.log(newProgram);
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

router.get(
  "/referralProgramById/:programId",
  verifyToken,
  async (req: Request, res, next) => {
    try {
      const programId = req.params.programId;

      // Find the referral program for the logged-in user
      const referralProgram = await ReferralModel.findById(programId);

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

router.get(
  "/referrer/:referrerId",
  verifyToken,
  async (req: Request, res, next) => {
    try {
      const referrerId = req.params.referrerId;

      // Find the referral program for the logged-in user
      const referrer = await UserModel.findById(referrerId);

      if (!referrer) {
        return res.status(404).json({ error: "Not found" });
      }

      res.status(200).json({ user: referrer });
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
  "/verifyReferralCode",
  verifyToken,
  authorize(["CUSTOMER", "ADMIN"]),
  async (req: Request, res: Response, next: NextFunction) => {
    const qrCode: ReferralProgramQRCode = req.body;
    try {
      if (!qrCode.campaignId || !qrCode.code || !qrCode.referrerId) {
        return res.status(400).json({ error: "Required fields is missing" });
      }

      // Generate the 6-digit code
      const referralCode = generateCode(qrCode.referrerId, qrCode.campaignId);
      if (referralCode !== qrCode.code) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      if (qrCode.referrerId === req.userId.toString()) {
        return res.status(400).json({ error: "Can't claim own referral code" });
      }

      //Check if the campaign existed
      const refProg = await ReferralModel.findById(qrCode.campaignId);
      if (!refProg) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      //Check if the campaign has expired
      const progEndDate = refProg.endDate;
      const currentDate = new Date();
      if (progEndDate && isBefore(progEndDate, currentDate)) {
        return res.status(400).json({ error: "The campaign has ended." });
      }

      const checkIn = await CheckInModel.findOne({
        businessId: refProg.userId,
        userId: req.userId,
      });
      if (checkIn) {
        return res
          .status(400)
          .json({ error: "Only applied to new customers." });
      }

      //Check if the user has claimed this reward before
      const existing = await RewardModel.findOne({
        userId: req.userId,
        referralProgramId: qrCode.campaignId,
      });

      if (existing) {
        return res
          .status(400)
          .json({ error: "The user has claimed this reward." });
      }

      const referrer = await UserModel.findById(qrCode.referrerId);
      if (!referrer) {
        return res.status(400).json({ error: "Invalid referrer." });
      }

      const business = await UserModel.findById(refProg.userId);
      if (!business) {
        return res.status(400).json({ error: "Invalid business." });
      }
      return res.status(200).json({
        campaign: refProg,
        referrerName: `${referrer.firstName} ${referrer.lastName}`,
        business: business,
        code: generateCode(
          qrCode.campaignId,
          req.userId.toString(),
          qrCode.referrerId
        ),
      });

      // //Create the rewards
      // const newReward = new RewardModel({
      //   userId: req.userId,
      //   referralProgramId: qrCode.campaignId,
      //   referredByUserId: qrCode.referrerId,
      // });
      // const futureDate = add(currentDate, { days: refProg.daysToRedeem }); // Add 7 days
      // if (progEndDate === undefined) {
      //   newReward.expireDate = futureDate;
      // } else {
      //   newReward.expireDate = isBefore(futureDate, progEndDate)
      //     ? futureDate
      //     : progEndDate;
      // }

      // await newReward.save();
      // return res.status(201).json({ message: "success" });
    } catch (error) {
      res.status(500).json({
        error: "An unexpected error happened.",
      });
      console.error("An unexpected error happened:", error);
      next(error);
    }
  }
);

router.get(
  "/getReferralCode/:progId",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      const progId = req.params.progId;
      const userId = req.userId;

      if (!userId || !progId) {
        return res.status(400).json({ error: "Required field is missing." });
      }

      const referralProgram = await ReferralModel.findOne({ _id: progId });
      if (!referralProgram) {
        return res.status(400).json({ error: "Promotion program not found." });
      }

      const referralCode = generateCode(userId.toString(), progId);
      res.status(200).json({ code: referralCode });
    } catch (error) {
      res.status(500).json({
        error: "An error occurred while retrieving the referral program.",
      });
      console.error("Error retrieving referral program:", error);
      next(error);
    }
  }
);

export default router;

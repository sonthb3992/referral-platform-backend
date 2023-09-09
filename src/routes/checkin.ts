import express from "express";
import { Request } from "../types/custom";
import { authorize, verifyToken } from "../middlewares/authentication";
import CheckInModel, { CheckIn } from "../models/checkin";

const router = express.Router();

router.post(
  "/checkin",
  verifyToken,
  authorize(["CUSTOMER", "ADMIN"]),
  async (req: Request, res, next) => {
    try {
      console.log(req.body);
      const formData: Partial<CheckIn> = req.body;
      if (!formData.outletId) {
        return res.status(400).json({ error: "Required fields are missing." });
      }

      const _checkin = new CheckInModel({
        userId: req.userId,
        outletId: formData.outletId,
        consents: formData.consents ?? [],
      });
      await _checkin.save();

      res.status(201).json({
        message: "Campaign created successfully.",
        checkIn: _checkin,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while checking you in." });
      console.error("Error creating campaign:", error);
      next(error);
    }
  }
);

router.get(
  "/recentCheckins/:count?",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      const count = parseInt(req.params.count);
      console.log("Count", count);
      const userId = req.userId;

      const result = await CheckInModel.find({ userId: userId })
        .sort({ crAt: -1 }) // Sort by createdAt in descending order (latest first)
        .limit(count || 20)
        .exec();
      res.status(200).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while fetching the outlet." });
      console.error("Error fetching outlet:", error);
      next(error);
    }
  }
);

export default router;

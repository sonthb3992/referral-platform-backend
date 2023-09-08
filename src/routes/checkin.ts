import express from "express";
import { Request } from "../types/custom";
import {
  authorize,
  createToken,
  verifyToken,
} from "../middlewares/authentication";
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

export default router;

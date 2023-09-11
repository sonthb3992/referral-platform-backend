import express from "express";
import { Request } from "../types/custom";
import { authorize, verifyToken } from "../middlewares/authentication";
import CheckInModel, { CheckIn } from "../models/checkin";
import { UserModel } from "../models/user";

const router = express.Router();

router.post(
  "/checkin",
  verifyToken,
  authorize(["CUSTOMER", "ADMIN"]),
  async (req: Request, res, next) => {
    try {
      const formData: Partial<CheckIn> = req.body;
      if (!formData.outletId) {
        return res.status(400).json({ error: "Required fields are missing." });
      }

      // Define the filter to find the existing record
      const filter = { userId: req.userId, outletId: formData.outletId };
      // Define the update to apply or create a new record
      const update = {
        userId: req.userId,
        outletId: formData.outletId,
        consents: formData.consents ?? [],
      };

      // Set the `upsert` option to true to create a new record if not found
      const options = { upsert: true, new: true, setDefaultsOnInsert: true };

      // Use findOneAndUpdate to update or create the record
      const updatedCheckIn = await CheckInModel.findOneAndUpdate(
        filter,
        update,
        options
      );

      // If the record existed, increment the visitCount
      if (updatedCheckIn) {
        updatedCheckIn.visitCount += 1;
        await updatedCheckIn.save();
      }

      res.status(201).json({
        message: "Campaign created successfully.",
        checkIn: updatedCheckIn,
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

router.post(
  "/toggleFavorite",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      const outletId = req.body.outletId;
      if (!outletId) {
        return res.status(400).json({ error: "Required fields are missing." });
      }
      // Find the user by userId in the token
      const user = await UserModel.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // Check if the outletId is already in the favoriteOutlets array
      const isFavorite = user.favoriteOutlets.includes(outletId);

      if (isFavorite) {
        // If it's a favorite, remove it
        user.favoriteOutlets = user.favoriteOutlets.filter(
          (favOutlet) => favOutlet.toString() !== outletId
        );
      } else {
        // If it's not a favorite, add it
        user.favoriteOutlets.push(outletId);
      }

      // Save the updated user
      await user.save();
      res.status(200).json(user);
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

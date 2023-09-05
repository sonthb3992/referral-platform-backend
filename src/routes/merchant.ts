import express from "express";
import admin from "../firebase/admin";
import { UserModel, businessOwnerAuthorizedRoles } from "../models/user";
import { Request } from "../types/custom";
import {
  authorize,
  createToken,
  verifyToken,
} from "../middlewares/authentication";
import OutletModel, { Outlet } from "../models/outlet";

interface MerchantOnboardingFormData {
  businessEmail: string;
}

const router = express.Router();

router.put(
  "/updateMerchantInfo",
  verifyToken,
  authorize(businessOwnerAuthorizedRoles),
  async (req: Request, res, next) => {
    try {
      const formData: MerchantOnboardingFormData = req.body;
      if (!formData.businessEmail) {
        return res.status(400).json({ error: "Required field is missing." });
      }

      // Find the user by userId in the token
      const userId = req.userId; // userId from the token

      const existingUser = await UserModel.findById(userId);

      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Update user's information
      if (formData.businessEmail) {
        existingUser.email = formData.businessEmail;
      }

      //Save the updated user
      await existingUser.save();

      res
        .status(200)
        .json({ message: "Business information updated successfully." });
      next();
    } catch (error: any) {
      console.error("Error updating Business information:", error);
      res.status(500).json({
        error: "An error occurred while updating Business information.",
      });
      next(error);
    }
  }
);

router.post(
  "/outlet",
  verifyToken,
  authorize(businessOwnerAuthorizedRoles),
  async (req: Request, res, next) => {
    try {
      const formData: Outlet = req.body;
      if (!formData.name || !formData.address) {
        return res.status(400).json({ error: "Required field is missing." });
      }

      // Check if an outlet with the same user and name (case-insensitive) already exists
      const existingOutlet = await OutletModel.findOne({
        userId: req.user._id,
        name: { $regex: new RegExp(`^${formData.name}$`, "i") },
      });

      if (existingOutlet) {
        return res
          .status(409)
          .json({ error: "Outlet with same name already exists." });
      }

      // Create a new outlet
      const newOutlet = new OutletModel({
        userId: req.user._id,
        name: formData.name,
        address: formData.address ?? "",
        phone: formData.phone,
        desc: formData.desc,
        imageUrl: formData.imageUrl,
      });

      await newOutlet.save();

      res
        .status(201)
        .json({ message: "Outlet created successfully.", outlet: newOutlet });
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while creating the outlet." });
      console.error("Error creating outlet:", error);
      next(error);
    }
  }
);

router.get(
  "/outlet",
  verifyToken,
  authorize(businessOwnerAuthorizedRoles),
  async (req: Request, res, next) => {
    try {
      // Retrieve all outlets for the authenticated user
      const outlets = await OutletModel.find({ userId: req.user._id });

      res.status(200).json({ outlets });
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while fetching outlets." });
      console.error("Error fetching outlets:", error);
      next(error);
    }
  }
);

router.get(
  "/outlet/:outletId",
  verifyToken,
  authorize(businessOwnerAuthorizedRoles),
  async (req: Request, res, next) => {
    try {
      const outletId = req.params.outletId;

      // Retrieve the outlet based on outletId and userId
      const outlet = await OutletModel.findOne({
        _id: outletId,
        userId: req.user._id,
      });

      if (!outlet) {
        return res.status(404).json({ error: "Outlet not found." });
      }

      res.status(200).json({ outlet });
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

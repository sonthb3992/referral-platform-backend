import express from "express";
import admin from "../firebase/admin";
import { UserModel } from "../models/user";
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

// Define authorized roles for the updateMemberInfo route
const businessOwnerAuthorizedRoles = ["BUSINESS_OWNER", "ADMIN"];

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

router.post("/merchantLogin", async (req, res, next) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if this user already exists in the database
    let user = await UserModel.findOne({ googleId: uid });
    let newUser = false;

    if (!user) {
      //User not existed then create new user
      user = new UserModel({
        googleId: uid,
        email: decodedToken.email,
        phone: decodedToken.phone_number,
        userRole: "BUSINESS_OWNER",
        profilePicture: decodedToken.picture,
      });

      // Save the user to the database
      await user.save();
      newUser = true;
    }

    const token = createToken(user.id, user.googleId, user.email, user.phone);
    res
      .cookie("jwt", token, {
        httpOnly: true,
        secure: false, // Set to true in production if using HTTPS
      })
      .status(newUser ? 201 : 200)
      .json({ message: "Login successful" });

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token.", litteral: error });
    console.log("Invalid token");
    next(error);
  }
});

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

export default router;

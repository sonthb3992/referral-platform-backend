import express from "express";
import admin from "../firebase/admin";
import { UserModel } from "../models/user";
import { Request } from "../types/custom";
import {
  authorize,
  createToken,
  verifyToken,
} from "../middlewares/authentication";

interface UserOnboardingFormData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  gender: string;
  dob: string;
}

const router = express.Router();

// Define authorized roles for the updateMemberInfo route
const updateUserInfoAuthorizedRoles = ["CUSTOMER", "ADMIN"];
router.put(
  "/updateMemberInfo",
  verifyToken,
  authorize(updateUserInfoAuthorizedRoles),
  async (req: Request, res, next) => {
    try {
      const formData: UserOnboardingFormData = req.body;
      if (!formData.firstName || !formData.lastName) {
        return res.status(400).json({ error: "Required field is missing." });
      }

      // Find the user by userId in the token
      const userId = req.userId; // userId from the token

      const existingUser = await UserModel.findById(userId);

      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Update user's information
      if (formData.firstName) {
        existingUser.firstName = formData.firstName;
      }

      if (formData.lastName) {
        existingUser.lastName = formData.lastName;
      }

      if (formData.address) {
        existingUser.address = formData.address;
      }

      if (formData.email) {
        existingUser.email = formData.email;
      }

      if (formData.gender) {
        existingUser.gender = formData.gender;
      }

      if (formData.dob) {
        existingUser.dob = formData.dob;
      }

      //Save the updated user
      await existingUser.save();

      res
        .status(200)
        .json({ message: "Member information updated successfully." });
      next();
    } catch (error: any) {
      console.error("Error updating member information:", error);
      res.status(500).json({
        error: "An error occurred while updating member information.",
      });
      next(error);
    }
  }
);

const handleLogin = async (req, res, next, userRole?: string) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const filter = userRole
      ? { googleId: uid, userRole: userRole }
      : { googleId: uid };

    // Check if this user already exists in the database
    let user = await UserModel.findOne(filter);
    let newUser = false;

    if (!user) {
      user = new UserModel({
        googleId: uid,
        email: decodedToken.email,
        phone: decodedToken.phone_number,
        userRole,
        profilePicture: decodedToken.picture,
      });
      await user.save();
      newUser = true;
    }

    const token = createToken(user.id, user.googleId, user.email, user.phone);
    res
      .cookie("jwt", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .status(newUser ? 201 : 200)
      .json({
        user,
        tokenTime: 3600,
      });

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token.", literal: error });
    console.log("Invalid token");
    next(error);
  }
};

router.post("/merchantLogin", async (req, res, next) => {
  await handleLogin(req, res, next, "BUSINESS_OWNER");
});

router.post("/memberLogin", async (req, res, next) => {
  await handleLogin(req, res, next, "CUSTOMER");
});

router.post("/login", async (req, res, next) => {
  await handleLogin(req, res, next, undefined);
});

export default router;
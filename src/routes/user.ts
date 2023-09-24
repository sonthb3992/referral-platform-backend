import { roundToNearestMinutes } from "date-fns";
import admin from "../firebase/admin";
import {
  authorize,
  createToken,
  verifyToken,
} from "../middlewares/authentication";
import { UserModel, customerAuthorizedRoles } from "../models/user";
import express, { Request, Response, NextFunction } from "express";

interface UserOnboardingFormData {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  gender: string;
  dob: string;
}

const router = express.Router();
router.get(
  "/userinfo",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      const user = req.user;
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
);

// Define authorized roles for the updateMemberInfo route
const updateUserInfoAuthorizedRoles = ["CUSTOMER", "ADMIN"];
router.put(
  "/updateMemberInfo",
  verifyToken,
  authorize(updateUserInfoAuthorizedRoles),
  async (req: Request, res, next) => {
    try {
      const userId = req.userId;
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      const formData: UserOnboardingFormData = req.body;
      const requiredFields = ["firstName", "lastName"];
      for (const field of requiredFields) {
        if (!formData[field]) {
          return res.status(400).json({ error: `${field} is required.` });
        }
      }
      for (const field in formData) {
        if (formData[field]) {
          existingUser[field] = formData[field];
        }
      }
      existingUser.onboarded = true;
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

const handleLogin = async (req, res, next, userRole: string) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if this user already exists in the database
    let user = await UserModel.findOne({ googleId: uid, userRole: userRole });
    let newUser = false;

    if (!user) {
      user = new UserModel({
        googleId: uid,
        email: decodedToken.email,
        phone: decodedToken.phone_number,
        userRole,
        profilePicture: decodedToken.picture,
        onboarded: false,
      });
      await user.save();
      newUser = true;
    }

    const token = createToken(user.id, user.googleId, user.email, user.phone);
    res.status(newUser ? 201 : 200).json({
      user,
      token,
    });

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "Invalid token.", literal: error });
    next(error);
  }
};

router.post("/merchantLogin", async (req, res, next) => {
  await handleLogin(req, res, next, "BUSINESS_OWNER");
});

router.post("/memberLogin", async (req, res, next) => {
  await handleLogin(req, res, next, "CUSTOMER");
});

router.get("/logout", async (req, res, next) => {
  try {
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token.", literal: error });
    console.log("error", error);
    next(error);
  }
});

export default router;

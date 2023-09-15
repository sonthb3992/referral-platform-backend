import express, { Request, Response, NextFunction } from "express";
import admin from "../firebase/admin";
import { UserModel, customerAuthorizedRoles } from "../models/user";
import ReferralModel, { Referral } from "../models/referral";
import { verifyToken, authorize } from "../middlewares/authentication";
import { MD5 } from "crypto-js";

const router = express.Router();

// router.post(
//   "/saveReward",
//   verifyToken,
//   authorize(["CUSTOMER"]),
//   async (req: Request, res, next) => {
//     try {
//       const formData: Outlet = req.body;
//       if (!formData.name || !formData.address) {
//         return res.status(400).json({ error: "Required field is missing." });
//       }

//       // Check if an outlet with the same user and name (case-insensitive) already exists
//       const existingOutlet = await OutletModel.findOne({
//         userId: req.user._id,
//         name: { $regex: new RegExp(`^${formData.name}$`, "i") },
//       });

//       if (existingOutlet) {
//         return res
//           .status(409)
//           .json({ error: "Outlet with same name already exists." });
//       }

//       // Create a new outlet
//       const newOutlet = new OutletModel({
//         userId: req.user._id,
//         name: formData.name,
//         address: formData.address ?? "",
//         phone: formData.phone,
//         desc: formData.desc,
//         imageUrl: formData.imageUrl,
//       });

//       await newOutlet.save();

//       res
//         .status(201)
//         .json({ message: "Outlet created successfully.", outlet: newOutlet });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "An error occurred while creating the outlet." });
//       console.error("Error creating outlet:", error);
//       next(error);
//     }
//   }
// );

export default router;

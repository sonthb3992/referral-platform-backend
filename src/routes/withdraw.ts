import { authorize, verifyToken } from "../middlewares/authentication";
import ReferralModel from "../models/referral";
import { UserModel, customerAuthorizedRoles } from "../models/user";
import express, { Request, Response, NextFunction } from "express";
import WithdrawalRequestModel from "../models/withdraw";

const router = express.Router();
router.post(
  "/withdraw/request",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      const { point } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      if (user.point < point) {
        return res.status(400).json({ error: "Insufficient point" });
      }

      const withdrawalRequest = new WithdrawalRequestModel({
        point: point,
        user: user._id,
      });

      await withdrawalRequest.save();

      res.status(200).json({ message: "Withdrawal request successful." });
    } catch (error) {
      console.log("error", error);
      res.status(500).json({ error: "An error occurred." });
      next(error);
    }
  }
);

router.put(
  "/withdraw/:requestId/approve",
  verifyToken,
  authorize(["BUSINESS_OWNER", "ADMIN", "BUSINESS_STAFF"]),
  async (req, res, next) => {
    try {
      const { requestId } = req.params;

      // Use await to properly retrieve the withdrawal request
      let withdrawalRequest = await WithdrawalRequestModel.findById(requestId);
      if (!withdrawalRequest) {
        return res.status(404).json({ error: "Withdrawal request not found." });
      }

      // Use await to properly retrieve the user
      let user = await UserModel.findById(withdrawalRequest.user);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (withdrawalRequest.status !== "PENDING") {
        return res
          .status(400)
          .json({ error: "Invalid withdrawal request status." });
      }

      // Update the withdrawal request status and deduct points from the user
      withdrawalRequest.status = "APPROVED";
      user.point -= withdrawalRequest.point;

      // Use await to save both the withdrawal request and user data
      await withdrawalRequest.save();
      await user.save();

      // Respond with a success message
      res
        .status(200)
        .json({ message: "Withdrawal request approved successfully." });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred." });
      next(error);
    }
  }
);

router.put(
  "/withdraw/:requestId/reject",
  verifyToken,
  authorize(["BUSINESS_OWNER", "ADMIN", "BUSINESS_STAFF"]),
  async (req, res, next) => {
    try {
      const { requestId } = req.params;

      // Use await to properly retrieve the withdrawal request
      const withdrawalRequest = await WithdrawalRequestModel.findById(
        requestId
      );

      // Check if the withdrawal request exists
      if (!withdrawalRequest) {
        return res.status(404).json({ error: "Withdrawal request not found." });
      }

      if (withdrawalRequest.status !== "PENDING") {
        return res
          .status(400)
          .json({ error: "Invalid withdrawal request status." });
      }

      // Update the withdrawal request status to "REJECTED"
      withdrawalRequest.status = "REJECTED";

      // Use await to save the updated withdrawal request
      await withdrawalRequest.save();

      // Respond with a success message
      res
        .status(200)
        .json({ message: "Withdrawal request rejected successfully." });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred." });
      next(error);
    }
  }
);

router.get(
  "/withdraw",
  verifyToken,
  authorize(["BUSINESS_OWNER", "ADMIN", "BUSINESS_STAFF"]),
  async (req: Request, res, next) => {
    try {
      const status = req.query.status; // Use req.query to get the query parameter
      let withdrawalRequestsQuery;

      if (status) {
        withdrawalRequestsQuery = WithdrawalRequestModel.find({ status });
      } else {
        withdrawalRequestsQuery = WithdrawalRequestModel.find();
      }

      // Populate the userId field with all fields from the User model
      const withdrawalRequests = await withdrawalRequestsQuery
        .populate("user", "")
        .exec();
      res.status(200).json({ withdrawalRequests });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred." });
      next(error);
    }
  }
);

export default router;

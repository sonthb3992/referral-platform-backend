import express, { Request, Response, NextFunction, request } from "express";
import { authorize, verifyToken } from "../middlewares/authentication";
import TransactionModel from "../models/transaction";

const router = express.Router();
router.get(
  "/transaction/recent",
  verifyToken,
  authorize(["CUSTOMER"]),
  async (req: Request, res, next) => {
    try {
      // Retrieve all outlets for the authenticated user
      const transactions = await TransactionModel.find({
        userId: req.userId,
      })
        .sort({ updatedAt: -1 }) // Sort in descending order by updatedAt
        .limit(5) // Limit the results to 5 documents
        .exec();

      res.status(200).json({ transactions });
    } catch (error) {
      res
        .status(500)
        .json({ error: "An error occurred while fetching transactions." });
      console.error("Error fetching transactions:", error);
      next(error);
    }
  }
);

export default router;

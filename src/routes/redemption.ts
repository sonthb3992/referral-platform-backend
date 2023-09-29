import express, { Request, Response, NextFunction } from "express";
import { authorize, verifyToken } from "../middlewares/authentication";
import RedemptionModel, { Redemption } from "../models/redemption";
const router = express.Router();

const vouchers = [
  {
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/caffino-referral-platform.appspot.com/o/1.png?alt=media&token=fa629abd-3588-4394-a408-efd0aa230e1a",
    value: 20000,
    point: 200,
  },
  {
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/caffino-referral-platform.appspot.com/o/2.png?alt=media&token=d8868a1c-5fce-4911-9e9f-86c9b4255d59",
    value: 50000,
    point: 500,
  },
  {
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/caffino-referral-platform.appspot.com/o/3.png?alt=media&token=8c3b62c5-cf18-4fc3-86c3-abcc6f20f41c",
    value: 100000,
    point: 1000,
  },
];

router.get(
  "/redemption",
  verifyToken,
  authorize(["CUSTOMER", "BUSINESS_STAFF", "BUSINESS_OWNER", "ADMIN"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      //Create default redemptions
      const redemptions = await RedemptionModel.find({ isActived: true });
      if (redemptions.length === 0) {
        for (const item of vouchers) {
          const newRedemption = new RedemptionModel({
            value: item.value,
            imageUrl: item.imageUrl,
            point: item.point,
          });
          await newRedemption.save();
        }
      }

      res
        .status(200)
        .json({ redemptions: await RedemptionModel.find({ isActived: true }) });
    } catch (error) {
      res.status(500).json({
        error: "An error occurred while retrieving the available redemptions.",
      });
      console.log(error);
      next(error);
    }
  }
);

export default router;

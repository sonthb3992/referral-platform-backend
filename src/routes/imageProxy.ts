import express from "express";
import { verifyToken } from "../middlewares/authentication";
import { Request } from "../types/custom";
import axios from "axios";

const router = express.Router();

router.get("/imageProxy/:url", verifyToken, async (req: Request, res, next) => {
  try {
    const imageUrl = req.params.url as string; // Get the image URL from the query parameter
    if (!imageUrl) {
      return res.status(400).json({ error: "Invalid image URL." });
    }
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const imageBuffer = Buffer.from(response.data);

    var base64Image = "data:Image;base64,";
    base64Image += imageBuffer.toString("base64"); // Convert the image buffer to a base64 string

    res.status(200).json({ base64: base64Image }); // Send the base64 image data in the response
  } catch (error) {
    console.error("Error fetching the image:", error);
    res.status(500).send("Error fetching the image.");
  }
});

export default router;

import express from "express";

const router = express.Router();

router.get("/ping", async (req, res, next) => {
  res.json({
    ping: "success",
  });
});

export default router;

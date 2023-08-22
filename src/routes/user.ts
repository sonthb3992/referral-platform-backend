import express from "express";
import admin from "../firebase/admin";
import { User } from "../models/user";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res, next) => {
  const { idToken } = req.body;
  console.log(idToken);
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if this user already exists in the database
    let user = await User.findOne({ uid });
    let newUser = false;

    if (!user) {
      //User not existed then create new user
      user = new User({
        googleId: uid,
        email: decodedToken.email,
        phone: decodedToken.phone_number,
        profilePicture: decodedToken.picture,
      });

      // Save the user to the database
      await user.save();
      newUser = true;
    }

    // Create a JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        googleId: user.googleId,
        email: user.email,
        phone: user.phone,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h", // Token will expire in 1 hour
      }
    );

    res
      .cookie("jwt", token, {
        httpOnly: true,
        secure: true, // Set to true in production if using HTTPS
      })
      .status(newUser ? 201 : 200)
      .json({ message: "Login successful" });
  } catch (error) {
    res.status(401).json({ error: "Invalid token.", litteral: error });
    console.log("Invalid token");
  }
});

export default router;

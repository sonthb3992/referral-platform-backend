import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { Request } from "../types/custom";
import { User, UserModel } from "../models/user";
import logger from "../utils/logger";
import { Types } from "mongoose";

export interface TokenPayload {
  userId: Types.ObjectId;
  googleId: string;
  email: string;
  phone: string;
}

const createToken = (
  userId: Types.ObjectId,
  googleId: string,
  email: string,
  phone: string
): string => {
  const tokenPayload: TokenPayload = {
    userId: userId,
    googleId: googleId,
    email: email,
    phone: phone,
  };
  // Create a JWT token
  const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, {
    expiresIn: "1h", // Token will expire in 1 hour
  });
  return token;
};

// Define the verifyToken middleware function
async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    // Extract the token without "Bearer"
    const tokenWithoutBearer = token.replace("Bearer ", "");

    // Verify the token using jwt.verify and wrap it in a Promise
    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(
        tokenWithoutBearer,
        process.env.SECRET_KEY || "",
        (err, decoded) => {
          if (err) {
            logger.error("Token verification error:", err);
            reject(err);
          } else {
            resolve(decoded);
          }
        }
      );
    });

    req.userId = decoded.userId;

    // Find the user based on the decoded userId
    const user = await UserModel.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
}

const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    if (roles.includes(user.userRole)) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
      logger.error(
        `username: ${user.id} is not authorized to access this route, role: ${user.userRole}`
      );
    }
  };
};

export { verifyToken, authorize, createToken };

import mongoose from "mongoose";

// Define the properties of the User interface
export interface User extends mongoose.Document {
  googleId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  userRole: "CUSTOMER" | "BUSINESS_OWNER" | "BUSINESS_STAFF" | "ADMIN";
  phone?: string;
  address?: string;
  point: number;
  profilePicture?: string;
  dob?: string;
  savedCodes: string[];
}

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true },
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    gender: { type: String },
    userRole: {
      type: String,
      required: true,
      enum: ["CUSTOMER", "BUSINESS_OWNER", "BUSINESS_STAFF", "ADMIN"],
      default: "CUSTOMER",
    },
    phone: { type: String },
    address: { type: String },
    point: { type: Number, default: 0 },
    profilePicture: { type: String },
    dob: { type: String },
  },
  {
    timestamps: {
      createdAt: "crAt",
      updatedAt: "upAt",
    },
  }
);

userSchema.set("timestamps", true);
export const UserModel = mongoose.model<User>("User", userSchema);
export const businessOwnerAuthorizedRoles = ["BUSINESS_OWNER", "ADMIN"];

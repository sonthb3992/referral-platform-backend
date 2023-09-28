import mongoose, { Schema } from "mongoose";

// Define the properties of the User interface
export interface User extends mongoose.Document {
  googleId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  onboarded: boolean;
  userRole: "CUSTOMER" | "BUSINESS_OWNER" | "BUSINESS_STAFF" | "ADMIN";
  phone?: string;
  address?: string;
  point: number;
  lockedPoint: number;
  profilePicture?: string;
  dob?: string;
  savedReferrals: string[];
  favoriteOutlets: string[];
}

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  email: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  gender: { type: String },
  onboarded: { type: Boolean },
  userRole: {
    type: String,
    required: true,
    enum: ["CUSTOMER", "BUSINESS_OWNER", "BUSINESS_STAFF", "ADMIN"],
    default: "CUSTOMER",
  },
  phone: { type: String },
  address: { type: String },
  point: { type: Number, default: 0 },
  lockedPoint: { type: Number, default: 0 },
  profilePicture: { type: String },
  dob: { type: String },
  savedReferrals: [{ type: String }],
  favoriteOutlets: [{ type: Schema.ObjectId, ref: "Outlet" }],
});

userSchema.set("timestamps", true);
export const UserModel = mongoose.model<User>("User", userSchema);
export const businessOwnerAuthorizedRoles = ["BUSINESS_OWNER", "ADMIN"];
export const customerAuthorizedRoles = ["CUSTOMER", "BUSINESS_OWNER", "ADMIN"];

import mongoose from "mongoose";

// Define the properties of the User interface
export interface User extends mongoose.Document {
  googleId: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  userRole: "CUSTOMER" | "BUSINESS" | "ADMIN";
  phone?: string;
  address?: string;
  point: number;
  profilePicture?: string;
  dob?: string;
}

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, required: true },
  email: { type: String },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  gender: { type: String },
  userRole: {
    type: String,
    required: true,
    enum: ["CUSTOMER", "BUSINESS", "ADMIN"],
    default: "CUSTOMER",
  },
  phone: { type: String },
  address: { type: String },
  point: { type: Number, default: 0 },
  profilePicture: { type: String },
  dob: { type: String },
});

export const UserModel = mongoose.model<User>("User", userSchema);

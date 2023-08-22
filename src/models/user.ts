import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, required: true },
  email: { type: String },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
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
});

export const User = mongoose.model("User", userSchema);
// module.exports = User;

import mongoose, { Schema } from "mongoose";

export interface Outlet extends mongoose.Document {
  userId: Schema.Types.ObjectId;
  name: string;
  address: string;
  phone?: string;
  desc?: string;
  imageUrl?: string;
}

const outletSchema: Schema<Outlet> = new Schema<Outlet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    desc: { type: String },
    imageUrl: { type: String },
  },
  {
    timestamps: {
      createdAt: "crAt",
      updatedAt: "upAt",
    },
  }
);

outletSchema.set("timestamps", true);
const OutletModel = mongoose.model<Outlet>("Outlet", outletSchema);

export default OutletModel;

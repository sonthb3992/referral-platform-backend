import mongoose, { Schema } from "mongoose";

export interface Outlet extends mongoose.Document {
  userId: string;
  name: string;
  address: string;
  phone?: string;
  imageUrl?: string;
}

const outletSchema: Schema<Outlet> = new Schema<Outlet>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String },
  imageUrl: { type: String },
});

const OutletModel = mongoose.model<Outlet>("Outlet", outletSchema);

export default OutletModel;

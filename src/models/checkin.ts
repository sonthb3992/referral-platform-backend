import mongoose, { Schema } from "mongoose";

export interface CheckIn extends mongoose.Document {
  userId: {
    type: Schema.Types.ObjectId;
    ref: "User";
    required: true;
  };
  outletId: {
    type: Schema.Types.ObjectId;
    ref: "Outlet";
    required: true;
  };
}

const checkInSchema: Schema<CheckIn> = new Schema<CheckIn>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    outletId: {
      type: Schema.Types.ObjectId,
      ref: "Outlet",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "crAt",
      updatedAt: "upAt",
    },
  }
);

checkInSchema.set("timestamps", true);
const CheckInModel = mongoose.model<CheckIn>("CheckIn", checkInSchema);
export default CheckInModel;

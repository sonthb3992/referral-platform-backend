import { Request } from "express";
import { User } from "../models/user";
import { Types } from "mongoose";

declare module "express" {
  export interface Request {
    user?: User;
    userId?: Types.ObjectId;
  }
}
export { Request };

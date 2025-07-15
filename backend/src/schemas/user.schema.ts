import mongoose from "mongoose";

export interface IUser extends mongoose.Document<string> {
  username: string;
  email: string;
  password: string;
  tokens: string[];
  profilePicture?: string;
}

export const userSchema = new mongoose.Schema<IUser>({
  _id: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  tokens: { type: [String], required: true },
  profilePicture: { type: String, required: false },
});

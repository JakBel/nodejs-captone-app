import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  username: String,
});

export const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: String,
  duration: Number,
  date: Date,
});

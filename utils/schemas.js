import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
    unique: true,
  },
});

export const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, "Duration is required"],
    min: [1, "Duration must be a positive number"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { exerciseSchema, userSchema } from "./utils/schemas.js";

mongoose.connect(process.env.MONGODB);

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* === USE === */
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/public"));

/* === GET === */
app.get("/", (_, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (_, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (err) {
    console.error(err);

    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    let query = Exercise.find({ userId: userId });
    const dateObj = {};

    if (req.query.from !== undefined)
      dateObj["$gte"] = new Date(req.query.from);

    if (req.query.to !== undefined) dateObj["$lte"] = new Date(req.query.to);

    if (Object.keys(dateObj).length > 0) query.find({ date: dateObj });

    if (req.query.limit) query.limit(Number(req.query.limit));

    const exercises = await query;

    const log = exercises.map((val) => ({
      description: val.description,
      duration: +val.duration,
      date: val.date.toDateString(),
    }));

    res.json({
      username: user.username,
      _id: user._id,
      count: log.length,
      log: log,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({ status: "error", message: "Invalid data" });
  }
});

/* === POST === */
app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res
        .status(400)
        .json({ status: "fail", message: "Username is required" });
    }

    const userObj = new User({ username: username });
    await userObj.save();

    res.status(201).json(userObj);
  } catch (err) {
    console.error(err);

    res.status(500).json({ status: "error", message: "Invalid data" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    if (!userId || !description || !duration) {
      return res.status(400).json({
        status: "fail",
        message: "UserID, Description and duration are required",
      });
    }

    const user = await User.findById(userId);

    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });

    const exercise = new Exercise({
      userId: userId,
      description,
      duration: duration,
      date: date ? new Date(date) : new Date(),
    });

    await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `User ID is required`,
  });
});

/* === LISTENING === */
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

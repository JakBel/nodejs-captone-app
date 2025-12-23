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

    let filter = { userId: userId };

    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date["$gte"] = new Date(req.query.from);
      if (req.query.to) filter.date["$lte"] = new Date(req.query.to);
    }

    const exercises = await Exercise.find(filter).sort({ date: 1 });

    const limit = req.query.limit ? Number(req.query.limit) : exercises.length;

    const logList = exercises.slice(0, limit);

    const log = logList.map((val) => ({
      description: val.description,
      duration: +val.duration,
      date: val.date.toDateString(),
    }));

    res.json({
      username: user.username,
      _id: user._id,
      count: exercises.length,
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

    if (!username || username.trim().length === 0) {
      return res
        .status(400)
        .json({ status: "fail", message: "Incorrect username provided" });
    }

    const userObj = new User({ username: username });
    await userObj.save();

    res.status(201).json(userObj);
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "This user already exists in database",
      });
    }

    res.status(500).json({ status: "error", message: "Server error" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    if (!description || !duration) {
      return res.status(400).json({
        status: "fail",
        message: "Description and duration are required",
      });
    }

    const durationNum = Number(duration);
    const dateObj = date ? new Date(date) : new Date();

    if (isNaN(durationNum) || durationNum <= 0 || isNaN(dateObj.getTime())) {
      return res.status(400).json({
        status: "fail",
        message:
          "Description must be 'string', duration positive 'number' and a date written in the format 'yyyy-mm-dd'",
      });
    }

    let user;

    try {
      user = await User.findById(userId);
    } catch (err) {
      return res.status(404).json({
        status: "fail",
        message: "User with this ID does not exist",
      });
    }

    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User with this ID does not exist" });
    }

    const exercise = new Exercise({
      userId: userId,
      description,
      duration: durationNum,
      date: dateObj,
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

app.post("/api/users//exercises", (_, res) => {
  res.status(400).json({
    status: "fail",
    message: "User ID is required",
  });
});

app.use((_, res) => {
  res.status(404).send("No page found");
});

/* === LISTENING === */
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

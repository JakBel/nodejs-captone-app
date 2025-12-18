import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config.js";
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
app.use(express.static(__dirname + "/public"));

/* === GET === */
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();

  res.json(users);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  let query = Exercise.find({ userId: userId });
  let dateObj = {};

  if (req.query.from !== undefined) dateObj["$gte"] = new Date(req.query.from);

  if (req.query.to !== undefined) dateObj["$lte"] = new Date(req.query.to);

  if (Object.keys(dateObj).length > 0) query.find({ date: dateObj });

  if (req.query.limit) query.limit(Number(req.query.limit));

  const user = await User.findById(userId);
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
});

/* === POST === */
app.post("/api/users", async (req, res) => {
  const userObj = new User({ username: req.body.username });
  await userObj.save();

  res.json(userObj);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const user = await User.findById(userId);
  let exercise;

  if (user) {
    exercise = new Exercise({
      userId: userId,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date || new Date(),
    });

    await exercise.save();
  }

  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  });
});

/* === LISTENING === */
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

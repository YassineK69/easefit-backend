const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  title: String,
  type: String,
  date: Date,
  duration: Number,
  grade: Number,
  comment: String,
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  activitiesPic: [String]
});

const Activity = mongoose.model("activities", activitySchema);
module.exports = Activity;
//
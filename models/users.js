const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  token: String,
  lastName: String,
  firstName: String,
  gender: String,
  birthday: Date,
  hight: Number,
  profilePic: String,
  idActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: "activities" }],
});

const User = mongoose.model("users", userSchema);

module.exports = User;

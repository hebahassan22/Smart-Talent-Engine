const mongoose = require("mongoose");

const JobRoleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  required_skills: [String],
  candidates_count: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("JobRole", JobRoleSchema);
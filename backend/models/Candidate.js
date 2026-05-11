const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  filename: { type: String, required: true },
  filetype: { type: String, default: "pdf" },
  score: { type: Number, default: 0 },
  experience_level: { type: String, default: "Junior" },
  years_of_experience: { type: Number, default: 0 },
  matched_skills: [String],
  missing_skills: [String],
  all_skills: [String],
  education: [String],
  certifications: [String],
  summary: { type: String, default: "" },
  strengths: [String],
  interview_questions: [String],
  resume_text: { type: String, default: "" },
  job_role: { type: String, default: "" },
  job_description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Candidate", CandidateSchema);
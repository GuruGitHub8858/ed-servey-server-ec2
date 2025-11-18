const mongoose = require("mongoose")

const SurveySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  currentInstitution: {
    type: String,
    required: [true, "Please provide your current institution"],
  },
  institutionLocation: {
    type: String,
    required: [true, "Please provide the institution location"],
  },
  currentResidence: {
    type: String,
    required: [true, "Please provide your current residence"],
  },
  educationLevel: {
    type: String,
    enum: ["high_school", "bachelors", "masters", "phd", "other"],
    required: [true, "Please select your education level"],
  },
  isMigrated: {
    type: String,
    enum: ["yes", "no"],
    required: [true, "Please indicate if you migrated for education"],
  },
  migrationReason: {
    type: String,
    required: function () {
      return this.isMigrated === "yes"
    },
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Survey", SurveySchema)


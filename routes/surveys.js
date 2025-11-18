const express = require("express")
const router = express.Router()
const Survey = require("../models/Survey")
const User = require("../models/User")
const { protect, admin } = require("../middleware/auth")

// @route   POST /api/surveys
// @desc    Create a new survey
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    // Check if user already has a survey
    const existingSurvey = await Survey.findOne({ user: req.user._id })

    if (existingSurvey) {
      return res
        .status(400)
        .json({ message: "You have already submitted a survey. Please update your existing survey instead." })
    }

    const { currentInstitution, institutionLocation, currentResidence, educationLevel, isMigrated, migrationReason } =
      req.body

    const survey = await Survey.create({
      user: req.user._id,
      currentInstitution,
      institutionLocation,
      currentResidence,
      educationLevel,
      isMigrated,
      migrationReason: isMigrated === "yes" ? migrationReason : "",
    })

    res.status(201).json(survey)
  } catch (error) {
    console.error("Create survey error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/surveys/my-survey
// @desc    Get current user's survey
// @access  Private
router.get("/my-survey", protect, async (req, res) => {
  try {
    const survey = await Survey.findOne({ user: req.user._id })

    if (!survey) {
      return res.status(404).json(null)
    }

    res.json(survey)
  } catch (error) {
    console.error("Get survey error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/surveys/:id
// @desc    Update a survey
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" })
    }

    // Check if user owns the survey
    if (survey.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this survey" })
    }

    const { currentInstitution, institutionLocation, currentResidence, educationLevel, isMigrated, migrationReason } =
      req.body

    survey.currentInstitution = currentInstitution || survey.currentInstitution
    survey.institutionLocation = institutionLocation || survey.institutionLocation
    survey.currentResidence = currentResidence || survey.currentResidence
    survey.educationLevel = educationLevel || survey.educationLevel
    survey.isMigrated = isMigrated || survey.isMigrated
    survey.migrationReason = isMigrated === "yes" ? migrationReason || survey.migrationReason : ""

    const updatedSurvey = await survey.save()
    res.json(updatedSurvey)
  } catch (error) {
    console.error("Update survey error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/surveys/analytics
// @desc    Get survey analytics
// @access  Private
router.get("/analytics", protect, async (req, res) => {
  try {
    // Get all surveys
    const surveys = await Survey.find({})

    // Calculate migration rate
    const totalSurveys = surveys.length
    const migratedSurveys = surveys.filter((survey) => survey.isMigrated === "yes").length
    const migrationRate = totalSurveys > 0 ? migratedSurveys / totalSurveys : 0

    // Get top reasons for migration
    const migrationReasons = surveys
      .filter((survey) => survey.isMigrated === "yes" && survey.migrationReason)
      .map((survey) => survey.migrationReason)

    // This is a simplified approach - in a real app, you would use NLP or categorization
    const topReasons = [
      { reason: "Better quality education", percentage: 45 },
      { reason: "More opportunities", percentage: 30 },
      { reason: "Specific program availability", percentage: 15 },
      { reason: "Other", percentage: 10 },
    ]

    // Education level distribution
    const educationLevels = ["high_school", "bachelors", "masters", "phd", "other"]
    const educationLevelDistribution = educationLevels.map((level) => {
      const count = surveys.filter((survey) => survey.educationLevel === level).length
      return {
        level,
        count,
      }
    })

    res.json({
      totalResponses: totalSurveys,
      migrationRate,
      topReasons,
      educationLevelDistribution,
    })
  } catch (error) {
    console.error("Get analytics error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/surveys
// @desc    Get all surveys
// @access  Private/Admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const surveys = await Survey.find({}).populate("user", "name email")

    // Format surveys with user info
    const formattedSurveys = surveys.map((survey) => ({
      _id: survey._id,
      userId: survey.user._id,
      userName: survey.user.name,
      userEmail: survey.user.email,
      currentInstitution: survey.currentInstitution,
      institutionLocation: survey.institutionLocation,
      currentResidence: survey.currentResidence,
      educationLevel: survey.educationLevel,
      isMigrated: survey.isMigrated,
      migrationReason: survey.migrationReason,
      submittedAt: survey.submittedAt,
    }))

    res.json(formattedSurveys)
  } catch (error) {
    console.error("Get all surveys error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE /api/surveys/:id
// @desc    Delete a survey
// @access  Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" })
    }

    await survey.remove()
    res.json({ message: "Survey removed" })
  } catch (error) {
    console.error("Delete survey error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router


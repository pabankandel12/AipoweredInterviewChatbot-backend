const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  feedback: { type: String, default: "" },
  score: { type: Number, default: 0 }
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    candidateName: {
      type: String,
      default: "Unknown"
    },
    skills: [
      {
        type: String
      }
    ],
    matchScore: {
      type: Number,
      default: 0
    },
    jd: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    },
    questions: [
      {
        type: String
      }
    ],
    conversations: [conversationSchema],
    currentIndex: {
      type: Number,
      default: 0
    },
    overallScore: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);

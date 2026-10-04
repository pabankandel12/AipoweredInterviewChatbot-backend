const express = require("express");
const multer = require("multer");
const authMiddleware = require("../../middleware/auth.middleware");
const interviewController = require("./interview.controller");

const router = express.Router();

// Multer memory storage configuration (saves upload as a buffer in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const isSupportedExtension = /\.(pdf|docx)$/i.test(file.originalname || "");
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      isSupportedExtension
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX resume formats are supported."), false);
    }
  },
});

// Protect all interview routes with JWT authentication middleware
router.use(authMiddleware);

// Route definitions
router.post("/start", upload.single("cv"), interviewController.startInterview);
router.post("/:id/answer", interviewController.submitAnswer);
router.get("/history", interviewController.getHistory);
router.get("/:id", interviewController.getInterviewDetails);

module.exports = router;

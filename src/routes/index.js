const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.route");
const interviewRoutes = require("../modules/interview/interview.route");

router.use("/auth", authRoutes);
router.use("/interview", interviewRoutes);

module.exports = router;
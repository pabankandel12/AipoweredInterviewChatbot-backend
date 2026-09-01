const axios = require("axios");
const FormData = require("form-data");
const Interview = require("./interview.model");

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

// 1. START INTERVIEW (Parses CV and generates questions)
exports.startInterview = async (req, res) => {
  try {
    const { jd, difficulty } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "CV file (PDF/DOCX) is required" });
    }

    if (!jd) {
      return res.status(400).json({ message: "Job description is required" });
    }

    // Forward the file and parameters to the FastAPI microservice
    const formData = new FormData();
    formData.append("cv", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append("jd", jd);
    formData.append("difficulty", difficulty || "medium");

    console.log(`Sending CV analysis request to FastAPI at ${FASTAPI_URL}/interview`);
    
    const fastApiResponse = await axios.post(`${FASTAPI_URL}/interview`, formData, {
      headers: formData.getHeaders(),
    });

    if (fastApiResponse.data.error) {
      return res.status(500).json({ 
        message: "AI Pipeline Error", 
        error: fastApiResponse.data.error 
      });
    }

    const { name, skills, match_score, questions } = fastApiResponse.data;

    // Save the interview session to MongoDB
    const interview = await Interview.create({
      userId: req.user.id,
      candidateName: name || "Unknown",
      skills: skills || [],
      matchScore: Math.round((match_score || 0) * 100), // convert 0.75 -> 75%
      jd,
      difficulty: difficulty || "medium",
      questions: questions || [],
      conversations: [],
      currentIndex: 0,
      completed: false,
    });

    res.status(201).json({
      message: "Interview session initialized successfully",
      interviewId: interview._id,
      firstQuestion: interview.questions[0] || "Could you describe your background and experience?",
      totalQuestions: interview.questions.length,
      matchScore: interview.matchScore,
      skills: interview.skills,
      candidateName: interview.candidateName,
    });

  } catch (error) {
    console.error("Error starting interview:", error.message);
    res.status(500).json({ 
      message: "Failed to start interview. Make sure the AI microservice is running.",
      error: error.message 
    });
  }
};

// 2. SUBMIT ANSWER (Evaluates answer, saves progress, returns next question)
exports.submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: "Answer cannot be empty" });
    }

    const interview = await Interview.findOne({ _id: id, userId: req.user.id });

    if (!interview) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    if (interview.completed) {
      return res.status(400).json({ message: "This interview session has already been completed" });
    }

    const currentQuestion = interview.questions[interview.currentIndex];
    
    if (!currentQuestion) {
      return res.status(400).json({ message: "No question found for the current index" });
    }

    // Call FastAPI to evaluate the answer
    console.log(`Sending answer evaluation request to FastAPI at ${FASTAPI_URL}/evaluate`);
    const evaluationResponse = await axios.post(`${FASTAPI_URL}/evaluate`, {
      question: currentQuestion,
      answer: answer,
      jd: interview.jd,
      difficulty: interview.difficulty,
    });

    if (evaluationResponse.data.error) {
      return res.status(500).json({ 
        message: "AI Evaluation Error", 
        error: evaluationResponse.data.error 
      });
    }

    const { feedback, score } = evaluationResponse.data;

    // Store conversation entry in Mongoose array
    interview.conversations.push({
      question: currentQuestion,
      answer,
      feedback: feedback || "Answer received.",
      score: typeof score === "number" ? score : 70
    });

    // Advance the question index
    interview.currentIndex += 1;

    // Check if the interview is now complete
    if (interview.currentIndex >= interview.questions.length) {
      interview.completed = true;
      
      // Calculate final overall score
      const totalScore = interview.conversations.reduce((sum, item) => sum + item.score, 0);
      interview.overallScore = Math.round(totalScore / interview.questions.length);
    }

    await interview.save();

    res.json({
      message: "Answer submitted successfully",
      feedback,
      score,
      currentIndex: interview.currentIndex,
      completed: interview.completed,
      nextQuestion: interview.completed ? null : interview.questions[interview.currentIndex],
      overallScore: interview.completed ? interview.overallScore : null,
    });

  } catch (error) {
    console.error("Error submitting answer:", error.message);
    res.status(500).json({ 
      message: "Failed to evaluate answer. Make sure the AI microservice is running.",
      error: error.message 
    });
  }
};

// 3. GET INTERVIEW HISTORY (List of all user's sessions)
exports.getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id })
      .select("candidateName skills matchScore difficulty completed overallScore createdAt")
      .sort({ createdAt: -1 });

    res.json(interviews);
  } catch (error) {
    console.error("Error fetching history:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 4. GET DETAILED RESULTS (For a specific session)
exports.getInterviewDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findOne({ _id: id, userId: req.user.id });

    if (!interview) {
      return res.status(404).json({ message: "Interview session not found" });
    }

    res.json(interview);
  } catch (error) {
    console.error("Error fetching interview details:", error.message);
    res.status(500).json({ message: error.message });
  }
};

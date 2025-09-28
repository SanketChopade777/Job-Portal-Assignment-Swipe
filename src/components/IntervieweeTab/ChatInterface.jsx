import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Card,
  Input,
  Button,
  List,
  Typography,
  Progress,
  Alert,
  message,
} from "antd";
import {
  SendOutlined,
  PauseOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  addChatMessage,
  setCurrentQuestion,
  setTimer,
  updateInterviewProgress,
  completeInterviewSuccess,
  pauseInterview,
  resumeInterview,
} from "../../store/slices/interviewSlice";
import { addCandidate } from "../../store/slices/candidateSlice";
import apiService from "../../services/apiService";
import InterviewHeader from "./InterviewHeader";
import ChatMessage from "./ChatMessage";

const { TextArea } = Input;
const { Title, Text } = Typography;

const ChatInterface = () => {
  const dispatch = useDispatch();
  const {
    chatHistory,
    currentQuestion,
    timer,
    interviewProgress,
    resumeData,
    isPaused,
  } = useSelector((state) => state.interview);

  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);
  const isInterviewRunning = useRef(false);
  const questionGenerationLock = useRef(false);

  const difficultyLevels = ["Easy", "Medium", "Hard"];
  const timeLimits = { Easy: 20, Medium: 60, Hard: 120 };

  useEffect(() => {
    if (isInterviewRunning.current) {
      console.log("🚫 Interview already running in another instance");
      return;
    }

    isInterviewRunning.current = true;
    console.log("✅ Interview instance started");

    return () => {
      isInterviewRunning.current = false;
      questionGenerationLock.current = false;
      console.log("✅ Interview instance cleaned up");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.questionGenerationInProgress = false;
    };
  }, []);

  // Disable copy-paste
  useEffect(() => {
    const handleCopyPaste = (e) => {
      if (e.type === "copy" || e.type === "paste" || e.type === "cut") {
        e.preventDefault();
        message.warning(`${e.type} is disabled during the interview`);
      }
    };

    ["copy", "paste", "cut"].forEach((event) => {
      document.addEventListener(event, handleCopyPaste);
    });

    return () => {
      ["copy", "paste", "cut"].forEach((event) => {
        document.removeEventListener(event, handleCopyPaste);
      });
    };
  }, []);

  const getCurrentDifficulty = () => {
    const index = interviewProgress.currentQuestionIndex;
    if (index < 2) return "Easy";
    if (index < 4) return "Medium";
    return "Hard";
  };

  const generateNextQuestion = useCallback(async () => {
    // Enhanced protection
    if (questionGenerationLock.current) {
      console.log("⏸️ Question generation locked - already in progress");
      return;
    }

    // Prevent generating more than 6 questions
    if (interviewProgress.currentQuestionIndex >= 6) {
      console.log("✅ Interview completed - 6 questions reached");
      return;
    }

    // Check if we're in a valid state to generate next question
    if (currentQuestion) {
      console.log("⚠️ Current question still active, waiting for evaluation");
      return;
    }

    questionGenerationLock.current = true;
    setLoading(true);

    try {
      const difficulty = getCurrentDifficulty();
      console.log(
        `🎯 Generating question ${
          interviewProgress.currentQuestionIndex + 1
        }/6 (${difficulty})`
      );

      const context = `Candidate: ${resumeData.name}, Position: Full Stack Developer`;
      const question = await apiService.generateQuestion(difficulty, context);

      if (!question) {
        throw new Error("Failed to generate question");
      }

      // Check for recent similar questions (last 3 questions)
      const recentQuestions = chatHistory
        .filter((msg) => msg.type === "question")
        .slice(-3)
        .map((msg) => msg.content);

      const isSimilar = recentQuestions.some(
        (recentQ) =>
          recentQ.includes(question.substring(0, 50)) ||
          question.includes(recentQ.substring(0, 50))
      );

      if (isSimilar) {
        console.log(
          "🔄 Similar question detected, skipping to avoid duplicates"
        );
        // IMPORTANT: Don't return here - generate a different question instead
        console.log("🔄 Generating alternative question...");
        const alternativeQuestion = await apiService.generateQuestion(
          difficulty,
          context +
            " Generate a different type of question, not about React components."
        );

        if (
          alternativeQuestion &&
          !recentQuestions.some(
            (recentQ) =>
              recentQ.includes(alternativeQuestion.substring(0, 50)) ||
              alternativeQuestion.includes(recentQ.substring(0, 50))
          )
        ) {
          // Use the alternative question
          dispatchQuestion(alternativeQuestion, difficulty);
        } else {
          // If alternative is also similar, use mock question as fallback
          console.log("🔄 Using mock question as fallback");
          const mockQuestions = {
            Easy: [
              "What is JSX in React and how is it different from HTML?",
              "Explain the concept of components in React.",
              "What are props in React and how do you use them?",
              "How do you handle events in React?",
              "What is the difference between functional and class components?",
            ],
            Medium: [
              "How does React's virtual DOM improve performance?",
              "What are React hooks and why were they introduced?",
              "Explain the useEffect hook and its dependencies.",
              "How do you manage state in a React application?",
              "What is the purpose of keys in React lists?",
            ],
            Hard: [
              "Explain React's reconciliation algorithm.",
              "How would you optimize a React application's performance?",
              "What are React error boundaries and how do they work?",
              "Explain the Context API and when to use it.",
              "How does React handle server-side rendering?",
            ],
          };

          const questions = mockQuestions[difficulty] || mockQuestions.Easy;
          const randomQuestion =
            questions[Math.floor(Math.random() * questions.length)];
          dispatchQuestion(randomQuestion, difficulty);
        }
      } else {
        // Use the original question if not similar
        dispatchQuestion(question, difficulty);
      }
    } catch (error) {
      console.error("❌ Error generating question:", error);
      // Use fallback mock question
      const difficulty = getCurrentDifficulty();
      const mockQuestion = `Explain the importance of ${difficulty.toLowerCase()} level concepts in React development.`;
      dispatchQuestion(mockQuestion, difficulty);
    } finally {
      setLoading(false);
      // Release the lock after a short delay
      setTimeout(() => {
        questionGenerationLock.current = false;
        console.log("🔓 Question generation lock released");
      }, 500);
    }
  }, [
    interviewProgress.currentQuestionIndex,
    currentQuestion,
    chatHistory,
    resumeData,
    dispatch,
  ]);

  // Helper function to dispatch question
  const dispatchQuestion = (question, difficulty) => {
    dispatch(
      setCurrentQuestion({
        text: question,
        difficulty: difficulty,
        timeLimit: timeLimits[difficulty],
      })
    );

    dispatch(setTimer(timeLimits[difficulty]));

    dispatch(
      addChatMessage({
        type: "question",
        content: question,
        difficulty: difficulty,
        timestamp: new Date().toISOString(),
      })
    );

    console.log(
      `✅ Question ${
        interviewProgress.currentQuestionIndex + 1
      } generated successfully`
    );
  };

  const handleTimeUp = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const userAnswer =
      currentAnswer.trim() || "No answer provided (time expired)";

    dispatch(
      addChatMessage({
        type: "answer",
        content: userAnswer,
        timestamp: new Date().toISOString(),
      })
    );

    await evaluateAnswer(userAnswer);
    setCurrentAnswer("");
  };

  const evaluateAnswer = async (answer) => {
    setLoading(true);
    try {
      const actualAnswer = answer.trim();
      const isEmptyAnswer =
        actualAnswer === "" ||
        actualAnswer === "No answer provided" ||
        actualAnswer === "No answer provided (time expired)" ||
        actualAnswer.length < 3;

      let evaluation;

      if (isEmptyAnswer) {
        evaluation = {
          score: 0,
          feedback: "No substantial answer was provided for this question.",
          improvements: "Please provide a more detailed response.",
          strengths: "None - question was not properly attempted",
          breakdown: {
            technical_accuracy: 0,
            clarity: 0,
            examples: 0,
            completeness: 0,
          },
        };
      } else {
        evaluation = await apiService.evaluateAnswer(
          currentQuestion.text,
          actualAnswer,
          currentQuestion.difficulty
        );
      }

      dispatch(
        addChatMessage({
          type: "evaluation",
          content: `Score: ${evaluation.score}/10 - ${evaluation.feedback}`,
          evaluationData: evaluation,
          timestamp: new Date().toISOString(),
        })
      );

      const newScores = [...interviewProgress.scores, evaluation.score];
      const newIndex = interviewProgress.currentQuestionIndex + 1;

      console.log(
        `📊 Question ${newIndex} evaluated. Score: ${evaluation.score}/10`
      );

      if (newIndex >= 6) {
        console.log("🎉 Interview completed!");
        await completeInterviewProcess(newScores);
        return;
      }

      dispatch(
        updateInterviewProgress({
          currentQuestionIndex: newIndex,
          scores: newScores,
        })
      );

      dispatch(setCurrentQuestion(null));

      // Trigger next question generation after state update
      setTimeout(() => {
        generateNextQuestion();
      }, 1000);
    } catch (error) {
      console.error("Error evaluating answer:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeInterviewProcess = async (scores) => {
    try {
      const averageScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      const interviewData = {
        candidate: resumeData,
        scores: scores,
        chatHistory: chatHistory,
        totalQuestions: 6,
        answeredQuestions: scores.filter((score) => score > 0).length,
      };

      const summary = await apiService.generateSummary(interviewData);

      const candidateData = {
        id: Date.now().toString(),
        name: resumeData.name,
        email: resumeData.email,
        phone: resumeData.phone,
        score: parseFloat(averageScore.toFixed(1)),
        summary: summary,
        chatHistory: [...chatHistory],
        completedAt: new Date().toISOString(),
        resumeText: resumeData.rawText || "Manual entry",
      };

      dispatch(addCandidate(candidateData));
      dispatch(completeInterviewSuccess(candidateData));
      message.success("🎉 Interview completed successfully!");
    } catch (error) {
      console.error("Error completing interview:", error);
      message.error("Error completing interview");
    }
  };

  const handleSubmitAnswer = () => {
    if (currentAnswer.trim() && !loading && !isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      dispatch(
        addChatMessage({
          type: "answer",
          content: currentAnswer,
          timestamp: new Date().toISOString(),
        })
      );

      setCurrentAnswer("");
      evaluateAnswer(currentAnswer);
    } else if (!currentAnswer.trim()) {
      message.warning("Please enter your answer before submitting.");
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      dispatch(resumeInterview());
      message.success("Interview resumed!");
    } else {
      dispatch(pauseInterview());
      message.info("Interview paused. You can resume when ready.");
    }
  };

  const handleTextAreaKeyDown = (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "c" || e.key === "v" || e.key === "x")
    ) {
      e.preventDefault();
      message.warning("Copy-paste is disabled during the interview");
    }
  };

  useEffect(() => {
    if (!hasInitialized) {
      console.log("🔄 Initializing interview - THIS SHOULD RUN ONLY ONCE");

      const questionCount = chatHistory.filter(
        (msg) => msg.type === "question"
      ).length;
      const shouldGenerateQuestion =
        questionCount === 0 && interviewProgress.currentQuestionIndex === 0;

      if (shouldGenerateQuestion) {
        console.log("🚀 Generating first question - THIS SHOULD RUN ONLY ONCE");
        setTimeout(() => {
          generateNextQuestion();
        }, 500);
      }

      setHasInitialized(true);
    }
  }, [
    hasInitialized,
    chatHistory,
    interviewProgress.currentQuestionIndex,
    generateNextQuestion,
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Fixed: This useEffect should trigger next question generation
  useEffect(() => {
    console.log(
      "🔍 State check - currentQuestion:",
      currentQuestion,
      "index:",
      interviewProgress.currentQuestionIndex,
      "loading:",
      loading,
      "paused:",
      isPaused,
      "initialized:",
      hasInitialized
    );

    if (
      !currentQuestion &&
      interviewProgress.currentQuestionIndex < 6 &&
      !loading &&
      !isPaused &&
      hasInitialized &&
      !questionGenerationLock.current
    ) {
      console.log("🔄 Current question cleared, generating next question");
      setTimeout(() => {
        generateNextQuestion();
      }, 300);
    }
  }, [
    currentQuestion,
    interviewProgress.currentQuestionIndex,
    loading,
    isPaused,
    hasInitialized,
  ]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (currentQuestion && timer > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        dispatch(setTimer(timer - 1));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer, currentQuestion, isPaused, dispatch]);

  useEffect(() => {
    if (timer === 0 && currentQuestion && !isPaused) {
      handleTimeUp();
    }
  }, [timer, currentQuestion, isPaused]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const progressPercent = Math.round(
    (interviewProgress.currentQuestionIndex / 6) * 100
  );

  return (
    <Card
      style={{ maxWidth: 800, margin: "20px auto" }}
      className="interview-mode"
    >
      <InterviewHeader
        currentQuestionIndex={interviewProgress.currentQuestionIndex}
        currentDifficulty={currentQuestion?.difficulty}
        timer={timer}
        isPaused={isPaused}
      />

      {interviewProgress.currentQuestionIndex < 6 && currentQuestion && (
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <Button
            type={isPaused ? "primary" : "default"}
            icon={isPaused ? <PlayCircleOutlined /> : <PauseOutlined />}
            onClick={handlePauseResume}
            size="large"
          >
            {isPaused ? "▶️ Resume Interview" : "⏸️ Pause Interview"}
          </Button>
        </div>
      )}

      <div
        style={{
          height: 400,
          overflowY: "auto",
          border: "1px solid #d9d9d9",
          padding: 10,
          marginBottom: 20,
        }}
      >
        <List
          dataSource={chatHistory}
          renderItem={(item, index) => (
            <List.Item style={{ border: "none", padding: "5px 0" }}>
              <ChatMessage message={item} />
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>

      {interviewProgress.currentQuestionIndex < 6 &&
        currentQuestion &&
        !isPaused && (
          <div>
            <TextArea
              rows={4}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleTextAreaKeyDown}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              placeholder="Type your answer here... (Copy-paste is disabled)"
              disabled={loading}
              style={{ fontSize: "16px" }}
            />

            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text type={timer < 10 ? "danger" : "secondary"} strong>
                ⏱️ Time remaining: {Math.floor(timer / 60)}:
                {(timer % 60).toString().padStart(2, "0")}
              </Text>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitAnswer}
                loading={loading}
                size="large"
                disabled={!currentAnswer.trim()}
              >
                Submit Answer
              </Button>
            </div>
          </div>
        )}

      {isPaused && (
        <Alert
          message="Interview Paused"
          description="Click the 'Resume Interview' button to continue."
          type="warning"
          showIcon
        />
      )}

      {interviewProgress.currentQuestionIndex >= 6 && (
        <Alert
          message="Interview Completed"
          description="Thank you for completing the interview. Your results have been saved."
          type="success"
          showIcon
        />
      )}
    </Card>
  );
};

export default ChatInterface;

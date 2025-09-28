import React, { useEffect } from "react";
import { Tabs, Button, message } from "antd";
import { useSelector, useDispatch } from "react-redux";
import IntervieweeTab from "./IntervieweeTab/IntervieweeTab";
import InterviewerTab from "./InterviewerTab/InterviewerTab";
import WelcomeBackModal from "./modals/WelcomeBackModal";
import {
  resumeInterview,
  pauseInterview,
  resetInterview,
} from "../store/slices/interviewSlice";

const AppContent = () => {
  const dispatch = useDispatch();
  const { isPaused, currentStep, interviewStarted, chatHistory } = useSelector(
    (state) => state.interview
  );
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);

  useEffect(() => {
    const wasInterviewInProgress =
      localStorage.getItem("interviewInProgress") === "true";
    const shouldShowModal =
      wasInterviewInProgress &&
      (isPaused || (currentStep === "interview" && chatHistory.length > 0)) &&
      currentStep !== "completed";

    if (shouldShowModal) {
      setShowWelcomeModal(true);
    }
  }, []);

  useEffect(() => {
    if (currentStep === "interview" && interviewStarted) {
      localStorage.setItem("interviewInProgress", "true");
    } else if (currentStep === "completed") {
      localStorage.setItem("interviewInProgress", "false");
    }
  }, [currentStep, interviewStarted]);

  const handleWelcomeBack = () => {
    dispatch(resumeInterview());
    setShowWelcomeModal(false);
    localStorage.setItem("interviewInProgress", "true");
  };

  const handleNewInterview = () => {
    dispatch(resetInterview());
    setShowWelcomeModal(false);
    localStorage.setItem("interviewInProgress", "false");
  };

  const handlePauseInterview = () => {
    dispatch(pauseInterview());
    message.info("Interview paused. You can resume later.");
  };

  // Use the new items API for Tabs
  const tabItems = [
    {
      key: "interviewee",
      label: "🎯 Interviewee",
      children: <IntervieweeTab />,
    },
    {
      key: "interviewer",
      label: "📊 Interviewer Dashboard",
      children: <InterviewerTab />,
    },
  ];

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ color: "#1890ff", margin: 0 }}>
          🤖 AI-Powered Interview Assistant
        </h1>

        {/* {currentStep === "interview" && !isPaused && (
          <Button type="dashed" onClick={handlePauseInterview}>
            ⏸️ Pause Interview
          </Button>
        )} */}
      </div>

      <Tabs
        defaultActiveKey="interviewee"
        size="large"
        centered
        items={tabItems}
      />

      <WelcomeBackModal
        visible={showWelcomeModal}
        onContinue={handleWelcomeBack}
        onNewInterview={handleNewInterview}
      />
    </div>
  );
};

export default AppContent;

import React from "react";
import { Progress, Typography, Tag, Space, Alert } from "antd";

const { Title, Text } = Typography;

const InterviewHeader = ({
  currentQuestionIndex,
  currentDifficulty,
  timer,
  isPaused,
}) => {
  const progressPercent = Math.round((currentQuestionIndex / 6) * 100);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyEmoji = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "🟢";
      case "Medium":
        return "🟡";
      case "Hard":
        return "🔴";
      default:
        return "⚪";
    }
  };

  return (
    <div
      style={{
        marginBottom: 20,
        padding: "16px",
        background: "#f5f5f5",
        borderRadius: "8px",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {isPaused && (
          <Alert
            message="Interview Paused"
            description="Timer is stopped. Resume to continue."
            type="warning"
            showIcon
          />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            📊 Interview Progress
          </Title>
          <Tag color="blue">Question {currentQuestionIndex + 1} of 6</Tag>
        </div>

        <Progress
          percent={progressPercent}
          showInfo={true}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
        />

        {currentDifficulty && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text strong>
              {getDifficultyEmoji(currentDifficulty)} Current:{" "}
              {currentDifficulty} Level
            </Text>
            <Text type={timer < 10 ? "danger" : "secondary"} strong>
              ⏱️ Time: {formatTime(timer)}
            </Text>
          </div>
        )}
      </Space>
    </div>
  );
};

export default InterviewHeader;

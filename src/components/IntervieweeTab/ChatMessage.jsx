import React from "react";
import { Typography, Tag, Space } from "antd";

const { Text, Paragraph } = Typography;

const ChatMessage = ({ message }) => {
  const getMessageConfig = (type) => {
    switch (type) {
      case "question":
        return {
          emoji: "🤖",
          bgColor: "#f0f8ff",
          align: "left",
          sender: "Interviewer",
        };
      case "answer":
        return {
          emoji: "👤",
          bgColor: "#f0fff0",
          align: "right",
          sender: "You",
        };
      case "evaluation":
        return {
          emoji: "📊",
          bgColor: "#fff7e6",
          align: "left",
          sender: "Evaluation",
        };
      default:
        return {
          emoji: "💬",
          bgColor: "#f5f5f5",
          align: "left",
          sender: "System",
        };
    }
  };

  const config = getMessageConfig(message.type);
  const getScoreColor = (score) => {
    if (score >= 8) return "green";
    if (score >= 6) return "orange";
    return "red";
  };

  return (
    <div
      style={{
        textAlign: config.align,
        margin: "8px 0",
        padding: "12px",
        background: config.bgColor,
        borderRadius: "12px",
        borderLeft:
          config.align === "left" ? "4px solid #1890ff" : "4px solid #52c41a",
      }}
    >
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent:
              config.align === "right" ? "flex-end" : "flex-start",
            alignItems: "center",
          }}
        >
          <Text strong>
            {config.emoji} {config.sender}
          </Text>
          {message.difficulty && (
            <Tag color="blue" style={{ marginLeft: "8px" }}>
              {message.difficulty}
            </Tag>
          )}
        </div>

        <Paragraph style={{ margin: 0, textAlign: config.align }}>
          {message.content}
        </Paragraph>

        {message.type === "evaluation" && message.evaluationData && (
          <Space direction="vertical" size="small">
            <Tag color={getScoreColor(message.evaluationData.score)}>
              🎯 Score: {message.evaluationData.score}/10
            </Tag>
            <Text type="secondary">
              💡 {message.evaluationData.improvements}
            </Text>
          </Space>
        )}

        <Text type="secondary" style={{ fontSize: "12px" }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </Space>
    </div>
  );
};

export default ChatMessage;

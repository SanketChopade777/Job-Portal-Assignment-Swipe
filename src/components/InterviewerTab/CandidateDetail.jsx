import React from "react";
import { Card, Typography, Timeline, Tag, Row, Col, Divider } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const CandidateDetail = ({ candidate }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "green";
      case "Medium":
        return "orange";
      case "Hard":
        return "red";
      default:
        return "blue";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "success";
    if (score >= 6) return "warning";
    return "error";
  };

  const interviewMessages = candidate.chatHistory || [];

  // Prepare timeline items for new API
  const timelineItems = interviewMessages.map((message, index) => ({
    key: index,
    color:
      message.type === "evaluation"
        ? getScoreColor(message.evaluationData?.score)
        : "blue",
    dot:
      message.type === "question" ? (
        <ClockCircleOutlined />
      ) : (
        <CheckCircleOutlined />
      ),
    children: (
      <Card size="small" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <Text strong>
            {message.type === "question"
              ? "🤖 Interviewer Question"
              : message.type === "answer"
              ? "👤 Candidate Answer"
              : "📊 AI Evaluation"}
          </Text>
          {message.difficulty && (
            <Tag color={getDifficultyColor(message.difficulty)}>
              {message.difficulty}
            </Tag>
          )}
          {message.type === "evaluation" && (
            <Tag color={getScoreColor(message.evaluationData?.score)}>
              Score: {message.evaluationData?.score || 0}/10
            </Tag>
          )}
        </div>

        <Paragraph style={{ margin: 0 }}>
          {typeof message.content === "string"
            ? message.content
            : message.content?.feedback}
        </Paragraph>

        {message.type === "evaluation" && message.evaluationData && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              <strong>Improvements:</strong>{" "}
              {message.evaluationData.improvements}
            </Text>
          </div>
        )}

        <Text
          type="secondary"
          style={{ fontSize: "12px", display: "block", marginTop: 8 }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </Card>
    ),
  }));

  // Calculate actual completion rate based on answered questions
  const answeredQuestions =
    candidate.chatHistory?.filter(
      (m) =>
        m.type === "answer" &&
        m.content &&
        m.content !== "No answer provided" &&
        m.content.trim().length > 10
    ).length || 0;

  const completionRate = Math.round((answeredQuestions / 6) * 100);

  // Calculate average score excluding unanswered questions (score 0)
  const validScores =
    candidate.chatHistory
      ?.filter((m) => m.type === "evaluation")
      ?.map((m) => m.evaluationData?.score || 0)
      ?.filter((score) => score > 0) || [];

  const averageScore =
    validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;

  return (
    <div style={{ padding: "20px 0" }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Candidate Information" size="small">
            <p>
              <strong>Name:</strong> {candidate.name || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {candidate.email || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {candidate.phone || "N/A"}
            </p>
            <p>
              <strong>Final Score:</strong>
              <Tag
                color={getScoreColor(candidate.score)}
                style={{ marginLeft: 8 }}
              >
                {(candidate.score || 0).toFixed(1)}/10
              </Tag>
            </p>
            <p>
              <strong>Completed:</strong>{" "}
              {candidate.completedAt
                ? new Date(candidate.completedAt).toLocaleString()
                : "N/A"}
            </p>
          </Card>
        </Col>

        <Col span={16}>
          <Card title="AI Summary" size="small">
            <Paragraph>
              {candidate.summary || "No summary available."}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Title level={4}>Interview Transcript</Title>

      {/* Use new Timeline items API */}
      <Timeline items={timelineItems} />

      {interviewMessages.filter((m) => m.type === "evaluation").length > 0 && (
        <Card title="Performance Analysis" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <Title level={2} style={{ color: "#52c41a", margin: 0 }}>
                  {averageScore.toFixed(1)}
                </Title>
                <Text>Average Score</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <Title level={2} style={{ color: "#1890ff", margin: 0 }}>
                  {
                    interviewMessages.filter((m) => m.type === "question")
                      .length
                  }
                </Title>
                <Text>Total Questions</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <Title level={2} style={{ color: "#faad14", margin: 0 }}>
                  {completionRate}%
                </Title>
                <Text>Completion Rate</Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default CandidateDetail;

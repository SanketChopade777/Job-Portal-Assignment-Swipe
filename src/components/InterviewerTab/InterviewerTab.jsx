import React from "react";
import { useSelector } from "react-redux";
import { Empty, Card, Typography } from "antd";
import CandidateList from "./CandidateList";

const { Title, Paragraph } = Typography;

const InterviewerTab = () => {
  const { candidates } = useSelector((state) => state.candidates);

  if (candidates.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Title level={4}>No Interviews Conducted Yet</Title>
              <Paragraph>
                Candidate interviews will appear here once they complete the
                AI-powered interview process. Switch to the Interviewee tab to
                start a new interview session.
              </Paragraph>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Title level={3}>Interview Dashboard</Title>
        <Paragraph>
          Monitor candidate performances, review interview transcripts, and
          analyze AI-generated evaluations. Click on any candidate to view
          detailed interview results.
        </Paragraph>
      </Card>

      <div style={{ marginTop: 20 }}>
        <CandidateList />
      </div>
    </div>
  );
};

export default InterviewerTab;

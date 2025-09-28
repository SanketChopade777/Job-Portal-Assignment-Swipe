import React from "react";
import { Modal, Button, Typography } from "antd";

const { Title, Text } = Typography;

const WelcomeBackModal = ({ visible, onContinue, onNewInterview }) => {
  return (
    <Modal
      title="Welcome Back!"
      open={visible}
      footer={null}
      closable={false}
      centered
    >
      <div style={{ textAlign: "center" }}>
        <Title level={4}>We found an ongoing interview session</Title>
        <Text>
          Would you like to continue where you left off or start a new
          interview?
        </Text>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <Button type="primary" onClick={onContinue}>
            Continue Previous Interview
          </Button>
          <Button onClick={onNewInterview}>Start New Interview</Button>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;

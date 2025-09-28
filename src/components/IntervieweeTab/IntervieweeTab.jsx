import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ResumeUpload from "./ResumeUpload";
import ChatInterface from "./ChatInterface";
import { Result, Button, Card, Form, Input } from "antd";
import { useDispatch } from "react-redux";
import {
  resetInterview,
  setResumeData,
  setCurrentStep,
} from "../../store/slices/interviewSlice";

const IntervieweeTab = () => {
  const dispatch = useDispatch();
  const { currentStep, missingFields, resumeData } = useSelector(
    (state) => state.interview
  );
  const [form] = Form.useForm();
  const [interviewKey, setInterviewKey] = useState(0); // Use key to force re-render

  const handleNewInterview = () => {
    dispatch(resetInterview());
    setInterviewKey((prev) => prev + 1); // Reset key for new interview
  };

  const handleMissingFieldsSubmit = (values) => {
    const updatedResumeData = { ...resumeData, ...values };
    dispatch(setResumeData(updatedResumeData));
    dispatch(setCurrentStep("interview"));
    setInterviewKey((prev) => prev + 1); // Force new ChatInterface instance
  };

  const renderContent = () => {
    switch (currentStep) {
      case "resume_upload":
        return <ResumeUpload />;

      case "missing_fields":
        return (
          <Card
            title="Complete Your Information"
            style={{ maxWidth: 600, margin: "20px auto" }}
          >
            <p>We need some additional information to start your interview:</p>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleMissingFieldsSubmit}
              initialValues={resumeData}
            >
              {missingFields.includes("name") && (
                <Form.Item
                  label="Full Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please enter your name" },
                  ]}
                >
                  <Input placeholder="Enter your full name" />
                </Form.Item>
              )}

              {missingFields.includes("email") && (
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Please enter a valid email" },
                  ]}
                >
                  <Input placeholder="Enter your email" />
                </Form.Item>
              )}

              {missingFields.includes("phone") && (
                <Form.Item
                  label="Phone Number"
                  name="phone"
                  rules={[
                    {
                      required: true,
                      message: "Please enter your phone number",
                    },
                  ]}
                >
                  <Input placeholder="Enter your phone number" />
                </Form.Item>
              )}

              <Button type="primary" htmlType="submit" size="large" block>
                Start Interview
              </Button>
            </Form>
          </Card>
        );

      case "interview":
        return <ChatInterface key={`chat-interface-${interviewKey}`} />;

      case "completed":
        return (
          <Result
            status="success"
            title="Interview Completed Successfully!"
            subTitle="Your interview has been submitted and results are available in the Interviewer dashboard."
            extra={[
              <Button type="primary" key="console" onClick={handleNewInterview}>
                Start New Interview
              </Button>,
            ]}
          />
        );

      default:
        return <ResumeUpload />;
    }
  };

  return <div>{renderContent()}</div>;
};

export default IntervieweeTab;

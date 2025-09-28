import React, { useState } from "react";
import {
  Card,
  Button,
  Upload,
  message,
  Form,
  Input,
  Alert,
  Typography,
  Spin,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import {
  setResumeData,
  setCurrentStep,
  setMissingFields,
} from "../../store/slices/interviewSlice";
import {
  parsePDF,
  parseDOCX,
  validateResumeData,
} from "../../utils/resumeParser";

const { Title, Text } = Typography;

const ResumeUpload = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const handleFileUpload = async (file) => {
    setUploading(true);
    setValidationErrors([]);
    setExtractedData(null);

    try {
      let parsedData;

      if (file.type === "application/pdf") {
        try {
          parsedData = await parsePDF(file);
        } catch (pdfError) {
          console.warn("PDF.js failed, trying simple extraction:", pdfError);
          // Fallback to simple text extraction
          const text = await file.text();
          parsedData = extractInfoFromText(text);
        }
      } else {
        parsedData = await parseDOCX(file);
      }

      console.log("Parsed data:", parsedData);
      setExtractedData(parsedData);

      const { missing, errors } = validateResumeData(parsedData);
      setValidationErrors(errors);

      if (missing.length > 0) {
        dispatch(setMissingFields(missing));
        form.setFieldsValue(parsedData);
        message.warning(
          `Found ${missing.length} missing field(s). Please complete the information.`
        );
      } else {
        proceedToInterview(parsedData);
      }
    } catch (error) {
      console.error("Resume parsing error:", error);
      message.error("Failed to process resume. Please enter details manually.");
      setValidationErrors([
        "Unable to extract information automatically. Please fill the form below.",
      ]);
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file) => {
    const isPDF = file.type === "application/pdf";
    const isDOCX =
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isPDF && !isDOCX) {
      message.error("You can only upload PDF or DOCX files!");
      return false;
    }

    // Check file size (5MB limit)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("File must be smaller than 5MB!");
      return false;
    }

    handleFileUpload(file);
    return false;
  };

  const proceedToInterview = (resumeData) => {
    const { errors } = validateResumeData(resumeData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      message.error("Please fix the validation errors before proceeding");
      return;
    }

    dispatch(setResumeData(resumeData));
    dispatch(setCurrentStep("interview"));
    message.success("✅ Resume validated! Starting interview...");
  };

  const onManualSubmit = (values) => {
    const resumeData = {
      ...values,
      rawText: "Manually entered information",
      extractedFrom: "manual",
    };

    const { errors } = validateResumeData(resumeData);

    if (errors.length > 0) {
      setValidationErrors(errors);
      message.error("Please fix the validation errors");
      return;
    }

    proceedToInterview(resumeData);
  };

  const showExtractionResults = () => {
    if (!extractedData) return null;

    return (
      <Alert
        message="Information Extracted from Resume"
        description={
          <div>
            <p>
              <strong>Name:</strong> {extractedData.name || "Not found"}
            </p>
            <p>
              <strong>Email:</strong> {extractedData.email || "Not found"}
            </p>
            <p>
              <strong>Phone:</strong> {extractedData.phone || "Not found"}
            </p>
            {(!extractedData.name ||
              !extractedData.email ||
              !extractedData.phone) && (
              <Text type="warning">
                Some information was not found. Please complete the form below.
              </Text>
            )}
          </div>
        }
        type="info"
        style={{ marginBottom: 20 }}
      />
    );
  };

  return (
    <Card
      title="📄 Start Your Interview"
      style={{ maxWidth: 600, margin: "20px auto" }}
      extra={uploading && <Spin size="small" />}
    >
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <Title level={4}>Upload Your Resume</Title>
        <Text type="secondary">
          We'll automatically extract your information (PDF/DOCX)
        </Text>
      </div>

      {validationErrors.length > 0 && (
        <Alert
          message="Attention Required"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          }
          type="warning"
          style={{ marginBottom: 20 }}
        />
      )}

      {showExtractionResults()}

      <Upload
        name="resume"
        accept=".pdf,.docx"
        beforeUpload={beforeUpload}
        showUploadList={false}
        disabled={uploading}
      >
        <Button
          icon={<UploadOutlined />}
          size="large"
          type="primary"
          loading={uploading}
          block
          style={{ height: "50px", fontSize: "16px", marginLeft: "100px" }}
        >
          {uploading ? "Processing Resume..." : "Upload Resume (PDF/DOCX)"}
        </Button>
      </Upload>

      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <Text type="secondary">- OR -</Text>
      </div>

      <Title level={5}>✍️ Enter Your Details Manually</Title>

      <Form form={form} layout="vertical" onFinish={onManualSubmit}>
        <Form.Item
          label="Full Name"
          name="name"
          rules={[
            { required: true, message: "Please enter your full name" },
            { min: 2, message: "Name must be at least 2 characters" },
            { max: 50, message: "Name must be less than 50 characters" },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Enter your full name"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: "Please enter your email address" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="your.email@example.com"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Phone Number"
          name="phone"
          rules={[
            { required: true, message: "Please enter your phone number" },
            {
              pattern: /^[\+]?[1-9][\d]{7,14}$/,
              message: "Please enter a valid phone number (8-15 digits)",
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="+1234567890"
            size="large"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          style={{ height: "45px", fontSize: "16px" }}
        >
          🚀 Start Interview
        </Button>
      </Form>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <Text type="secondary">
          💡 You must complete all fields before starting the interview
        </Text>
      </div>
    </Card>
  );
};

export default ResumeUpload;

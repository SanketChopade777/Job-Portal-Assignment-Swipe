import React, { useState } from "react";
import {
  Table,
  Input,
  Button,
  Tag,
  Space,
  Card,
  Typography,
  Modal,
} from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentCandidate,
  setSearchTerm,
  setSortBy,
} from "../../store/slices/candidateSlice";
import CandidateDetail from "./CandidateDetail";

const { Title } = Typography;
const { Search } = Input;

const CandidateList = () => {
  const dispatch = useDispatch();
  const { candidates, searchTerm, sortBy } = useSelector(
    (state) => state.candidates
  );
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const handleSearch = (value) => {
    dispatch(setSearchTerm(value));
  };

  const handleSort = (key) => {
    dispatch(setSortBy(key));
  };

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setDetailModalVisible(true);
    dispatch(setCurrentCandidate(candidate));
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortBy === "score") {
      return (b.score || 0) - (a.score || 0);
    } else if (sortBy === "name") {
      return (a.name || "").localeCompare(b.name || "");
    } else if (sortBy === "date") {
      return new Date(b.completedAt) - new Date(a.completedAt);
    }
    return 0;
  });

  const getScoreColor = (score) => {
    if (score >= 8) return "green";
    if (score >= 6) return "orange";
    return "red";
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: (score) => (
        <Tag color={getScoreColor(score)}>{score?.toFixed(1) || "0"}/10</Tag>
      ),
    },
    {
      title: "Completion Date",
      dataIndex: "completedAt",
      key: "completedAt",
      sorter: (a, b) => new Date(a.completedAt) - new Date(b.completedAt),
      render: (date) => (date ? new Date(date).toLocaleDateString() : "N/A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <Title level={4}>Candidates ({sortedCandidates.length})</Title>
        <Space wrap>
          <Search
            placeholder="Search candidates..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />

          {/* Replace Button.Group with Space.Compact */}
          <Space.Compact>
            <Button
              type={sortBy === "score" ? "primary" : "default"}
              onClick={() => handleSort("score")}
            >
              Sort by Score
            </Button>
            <Button
              type={sortBy === "name" ? "primary" : "default"}
              onClick={() => handleSort("name")}
            >
              Sort by Name
            </Button>
            <Button
              type={sortBy === "date" ? "primary" : "default"}
              onClick={() => handleSort("date")}
            >
              Sort by Date
            </Button>
          </Space.Compact>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={sortedCandidates}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
        locale={{ emptyText: "No candidates found" }}
      />

      <Modal
        title="Candidate Interview Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
      >
        {selectedCandidate && <CandidateDetail candidate={selectedCandidate} />}
      </Modal>
    </Card>
  );
};

export default CandidateList;

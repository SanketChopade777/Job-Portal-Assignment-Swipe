# 🤖 AI-Powered Technical Interview Platform

![Node.js](https://img.shields.io/badge/Node.js-v16+-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Redux](https://img.shields.io/badge/Redux-Toolkit-764ABC?logo=redux)
![Ant Design](https://img.shields.io/badge/Ant%20Design-4.0-red?logo=antdesign)

An intelligent, full-stack technical interview platform that automates the interview process using **Groq’s lightning-fast AI models**.

---

## 🏗 Installation & Setup

### Prerequisites

- Node.js (v16+)
- Groq API key
- Modern web browser

### 1️⃣ Clone Repository

```bash
git clone https://github.com/SanketChopade777/Job-Portal-Assignment-Swipe.git
cd Job-Portal-Assignment-Swipe
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment

Create a `.env` file in root:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4️⃣ Run Development Server

```bash
npm run dev
```

---

## 🎯 Usage

### For Candidates

- Upload resume (PDF/DOCX)
- Complete missing profile info
- Start interview → answer timed questions
- View instant feedback & scores

### For Interviewers

- Monitor ongoing interviews
- Review completed interviews
- Access detailed scoring & performance analysis

---

## 🔧 Configuration

**Interview Settings**

- Total Questions: 6 (2 Easy, 2 Medium, 2 Hard)
- Time Limits: Easy → 20s, Medium → 60s, Hard → 120s
- Scoring: 0–10 scale with AI feedback

**AI Model Config** (`groqService.js`)

```js
MODELS: {
  FAST: "llama-3.1-8b-instant",
  QUALITY: "llama-3.3-70b-versatile",
  BALANCED: "qwen/qwen3-32b"
}
```

---

## 🚨 Security Features

- Copy-paste prevention during interviews
- Strong input validation
- API rate limiting
- Candidate data security

---

## 📊 API Integration

**Groq API Endpoints**

- `/openai/v1/chat/completions` → Question Generation
- Answer evaluation (real-time scoring)
- Interview summary & analysis

**Custom Endpoints**

- Resume parsing & extraction
- Candidate management
- Interview progress tracking

---

## 📁 Project Structure

```bash
src/
├── components/
│   ├── IntervieweeTab/
│   │   ├── ChatInterface.jsx       # Chat interview UI
│   │   ├── InterviewHeader.jsx     # Progress & timer
│   │   ├── ChatMessage.jsx         # Individual chat message
│   │   ├── IntervieweeTab.jsx      # Candidate interface
│   │   └── ResumeUpload.jsx        # Resume upload
│   ├── InterviewerTab/
│   │   ├── CandidateDetail.jsx     # Candidate details
│   │   ├── CandidateList.jsx       # Candidate list
│   │   └── InterviewerTab.jsx      # Interviewer dashboard
│   ├── modals/
│   │   └── WelcomeBackModal.jsx    # Welcome modal
│   ├── AppContent.jsx              # Main layout
│   └── ErrorBoundary.jsx           # Error handling
├── services/
│   ├── apiService.js               # API service layer
│   └── groqService.js              # Groq AI integration
├── store/
│   ├── slices/
│   │   ├── interviewSlice.js       # Interview state
│   │   └── candidateSlice.js       # Candidate state
│   └── index.js                    # Redux store config
└── utils/
    └── resumeParser.js             # Resume parsing utils
```

---

## 🐛 Troubleshooting

**Common Issues**

- `Error: Invalid Groq API key` → Check `.env` config
- Resume upload fails → Ensure PDF/DOCX <10MB
- Interview stuck → Refresh page & check browser console

**Debug Mode**

```js
localStorage.setItem("debug", "true");
```

---

## 🤝 Contributing

1. Fork repo
2. Create feature branch → `git checkout -b feature/amazing-feature`
3. Commit → `git commit -m "Add amazing feature"`
4. Push → `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 🙏 Acknowledgments

- ⚡ Groq for blazing-fast inference
- 🎨 Ant Design for UI
- ⚛️ React & Redux teams

---

## 📞 Support

- Open an issue on GitHub
- Check documentation
- Review troubleshooting section

---

> ⚠️ **Note:** This platform is for **technical screening purposes only**. Ensure compliance with local employment laws before using AI in hiring.

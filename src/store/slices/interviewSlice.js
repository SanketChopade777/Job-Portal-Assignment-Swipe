import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentStep: "resume_upload",
  resumeData: null,
  missingFields: [],
  chatHistory: [],
  currentQuestion: null,
  timer: 0,
  interviewProgress: {
    currentQuestionIndex: 0,
    questions: [],
    scores: [],
  },
  isPaused: false, // Make sure this exists
  interviewStarted: false,
  results: null,
  pausedTimer: null, // For storing timer when paused
};

const interviewSlice = createSlice({
  name: "interview",
  initialState,
  reducers: {
    setResumeData: (state, action) => {
      state.resumeData = action.payload;
    },
    setMissingFields: (state, action) => {
      state.missingFields = action.payload;
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
      // Set interviewStarted to true only when we actually start the interview
      if (action.payload === "interview") {
        state.interviewStarted = true;
      }
    },
    addChatMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
    },
    setTimer: (state, action) => {
      state.timer = action.payload;
    },
    updateInterviewProgress: (state, action) => {
      state.interviewProgress = {
        ...state.interviewProgress,
        ...action.payload,
      };
    },
    // pauseInterview: (state) => {
    //   state.isPaused = true;
    //   state.timer = 0; // Stop timer
    // },
    // resumeInterview: (state) => {
    //   state.isPaused = false;
    //   // Timer will be reset when next question loads
    // },
    pauseInterview: (state) => {
      state.isPaused = true;
      // Store current timer state
      state.pausedTimer = state.timer;
      state.timer = 0;
    },
    resumeInterview: (state) => {
      state.isPaused = false;
      // Restore timer if it was paused
      if (state.pausedTimer) {
        state.timer = state.pausedTimer;
        state.pausedTimer = null;
      }
    },
    resetInterview: (state) => {
      return {
        ...initialState,
        // Keep some state if needed, but reset most
        currentStep: "resume_upload",
        interviewStarted: false,
      };
    },
    // resetInterviewState: (state) => {
    //   return initialState;
    // },
    // Add a new action to mark interview as completed
    completeInterview: (state) => {
      state.currentStep = "completed";
      state.isPaused = false;
      state.interviewStarted = false;
    },
    // Add this reducer
    completeInterviewSuccess: (state, action) => {
      state.currentStep = "completed";
      state.isPaused = false;
      state.interviewStarted = false;
      state.results = action.payload; // Store results
    },
  },
});

export const {
  setResumeData,
  setMissingFields,
  setCurrentStep,
  addChatMessage,
  setCurrentQuestion,
  setTimer,
  updateInterviewProgress,
  pauseInterview,
  resumeInterview,
  resetInterview,
  completeInterview,
  completeInterviewSuccess,
} = interviewSlice.actions;
export default interviewSlice.reducer;

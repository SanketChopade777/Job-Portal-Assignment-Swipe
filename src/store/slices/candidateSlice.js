// src/store/slices/candidateSlice.js (Updated)
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  candidates: [],
  currentCandidate: null,
  searchTerm: "",
  sortBy: "score",
};

const candidateSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {
    addCandidate: (state, action) => {
      // Check if candidate already exists (update if exists)
      const existingIndex = state.candidates.findIndex(
        (c) => c.email === action.payload.email
      );

      if (existingIndex !== -1) {
        state.candidates[existingIndex] = action.payload;
      } else {
        state.candidates.push({
          ...action.payload,
          id: Date.now().toString(),
        });
      }
    },
    updateCandidate: (state, action) => {
      const index = state.candidates.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.candidates[index] = action.payload;
      }
    },
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    deleteCandidate: (state, action) => {
      state.candidates = state.candidates.filter(
        (c) => c.id !== action.payload
      );
    },
  },
});

export const {
  addCandidate,
  updateCandidate,
  setCurrentCandidate,
  setSearchTerm,
  setSortBy,
  deleteCandidate,
} = candidateSlice.actions;

export default candidateSlice.reducer;

import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import candidateSlice from "./slices/candidateSlice";
import interviewSlice from "./slices/interviewSlice";

const persistConfig = {
  key: "root",
  storage,
  version: 1,
};

const persistedCandidateReducer = persistReducer(persistConfig, candidateSlice);
const persistedInterviewReducer = persistReducer(persistConfig, interviewSlice);

export const store = configureStore({
  reducer: {
    candidates: persistedCandidateReducer,
    interview: persistedInterviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

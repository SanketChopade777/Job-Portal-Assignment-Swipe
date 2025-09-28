import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ConfigProvider } from "antd";
import { store, persistor } from "./store";
import AppContent from "./components/AppContent";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider>
          <ErrorBoundary>
            <div className="App">
              <AppContent />
            </div>
          </ErrorBoundary>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;

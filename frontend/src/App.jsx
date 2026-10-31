import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import HistoryPage from "./pages/HistoryPage";
import HomePage from "./pages/HomePage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./styles/globals.css";


function AppContent() {
  const { user, loading } = useAuth();

  return (
    <>
      <div className="min-h-screen bg-base text-primary">
        {user ? <Navbar /> : null}
        <main className="mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-20 text-center text-secondary">Checking your sign-in...</div>
          ) : user ? (
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          ) : (
            <AuthPage />
          )}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4200,
            style: {
              background: "#0D1120",
              color: "#E2E8F0",
              border: "1px solid rgba(255,255,255,0.06)"
            }
          }}
        />
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

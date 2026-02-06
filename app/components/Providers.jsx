"use client";

import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ToastProvider } from "./Toast";
import Navbar from "./Navbar";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

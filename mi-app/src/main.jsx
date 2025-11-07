import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthProvider";
import { ExpensesProvider } from "./context/ExpensesProvider";
import { CurrencyProvider } from "./context/CurrencyProvider";
import { ToastProvider } from "./components/Toast/Toast";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CurrencyProvider>
            <ExpensesProvider>
              <App />
            </ExpensesProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
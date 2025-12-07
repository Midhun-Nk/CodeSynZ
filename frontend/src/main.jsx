import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/AuthContext.jsx";
import { CodeProvider } from "./context/CodeContext.jsx";
import DashboardProvider from "./context/DashBoardContext.jsx";
import { Toaster } from "./components/common/Toaster.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
  <ThemeProvider>
    <AuthProvider>
      <DashboardProvider>
      {" "}
      <CodeProvider>
        <App />{" "}
       
      </CodeProvider>
      </DashboardProvider>
    </AuthProvider></ThemeProvider>
  </BrowserRouter>
);

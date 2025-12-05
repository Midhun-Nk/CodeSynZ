import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/AuthContext.jsx";
import { CodeProvider } from "./context/CodeContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      {" "}
      <CodeProvider>
        <App />{" "}
      </CodeProvider>
    </AuthProvider>
  </BrowserRouter>
);

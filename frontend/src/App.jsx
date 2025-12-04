import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import CodeEditor from "./pages/CodeEditor";
import OAuthSuccess from "./pages/OAuthSuccess";

// --- Protected Route Component ---
function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const path = window.location.pathname;

  if (path === "/oauth-success") {
    return children;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


export default function App() {
  return (
    <div>

      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
         path="/code-editor/:projectId"
          element={
            <ProtectedRoute>
              <CodeEditor />
            </ProtectedRoute>
          } 
        />
          <Route path="/oauth-success" element={<OAuthSuccess />} />

      </Routes>

    </div>
  );
}

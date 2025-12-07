import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const DashboardContext = createContext();
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

const API = `${BACKEND_URL}/auth`;

export default function DashboardProvider({ children }) {
    const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFilter, setActiveFilter] = useState('All Projects');
const [activeMenuId, setActiveMenuId] = useState(null);
  // --- DATA STATE ---
  const [projects, setProjects] = useState([]);
  const [invites, setInvites] = useState([]); // Stores pending invites
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // Toggle for bell dropdown
const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const toggleTheme = () => setDarkMode(!darkMode);
    const token = localStorage.getItem('token');

    const apiCall = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('token'); 
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, config);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'API Error');
  }
  return res.json();
};
  const fetchDashboardData = async ( 
    
  ) => {
    try {

      const user = localStorage.getItem('user');
      if (user) {
        setCurrentUser(JSON.parse(user));
      } 
      setIsLoading(true);
      // Run in parallel for speed
      const [projectsData, invitesData] = await Promise.all([
        apiCall('/projects'),
        apiCall('/invites')
      ]);
      setProjects(projectsData);
      setInvites(invitesData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
       fetchDashboardData,apiCall,setCurrentUser,setProjects,setInvites,setIsLoading,setIsCreating,setShowNotifications,setShowCreateModal,setNewProjectName,setNewProjectDesc,darkMode,setDarkMode,activeTab,setActiveTab,activeFilter,setActiveFilter,activeMenuId,setActiveMenuId,projects,invites,isLoading,isCreating,showNotifications,showCreateModal,newProjectName,newProjectDesc,currentUser,toggleTheme

      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

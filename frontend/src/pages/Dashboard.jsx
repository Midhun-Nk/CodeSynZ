import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  LayoutGrid, 
  Folder, 
  Users, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  MoreVertical, 
  Terminal, 
  Code2, 
  Cpu, 
  Globe, 
  Zap, 
  Hash,
  Share2,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SettingsView } from '../components/dashboard/SettingsView';
import { DeploymentsView } from '../components/dashboard/DeploymentsView';
import { NavItem } from '../components/dashboard/NavItem';

// --- CONFIG ---
const API_URL = 'http://localhost:4000/api';

// --- API HELPER ---
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFilter, setActiveFilter] = useState('All Projects');

  // --- DATA STATE ---
  const [projects, setProjects] = useState([]);
  const [invites, setInvites] = useState([]); // Stores pending invites
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // Toggle for bell dropdown

  const toggleTheme = () => setDarkMode(!darkMode);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
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

  // --- HANDLE INVITE RESPONSE (Accept/Reject) ---
  const handleInviteResponse = async (projectId, status) => {
    try {
      await apiCall(`/projects/${projectId}/invite/respond`, 'POST', { status });
      
      // Update UI: Remove the invite from the list
      setInvites(prev => prev.filter(i => i.projectId !== projectId));
      
      // If accepted, refresh projects to show the new one
      if (status === 'accepted') {
        const updatedProjects = await apiCall('/projects');
        setProjects(updatedProjects);
        // Optional: switch tab to projects
        setActiveTab('projects');
      }
      
      alert(`Invite ${status} successfully.`);
    } catch (error) {
      alert(`Error responding to invite: ${error.message}`);
    }
  };

  // --- CREATE PROJECT HANDLER ---
  const handleCreateProject = async () => {
    const name = window.prompt("Enter Project Name:");
    if (!name) return;

    try {
      setIsCreating(true);
      const newProject = await apiCall('/projects', 'POST', { 
        name: name,
        description: "Created via Dashboard"
      });
      navigate(`/code-editor/${newProject._id}`); 
    } catch (error) {
      alert("Error creating project: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  // --- HELPER: VISUALS ---
  const getProjectStyle = (index) => {
    const styles = [
      { icon: Hash, color: 'text-green-500', bg: 'bg-green-500/10', lang: 'Node.js' },
      { icon: Code2, color: 'text-blue-500', bg: 'bg-blue-500/10', lang: 'React' },
      { icon: Cpu, color: 'text-yellow-500', bg: 'bg-yellow-500/10', lang: 'Python' },
      { icon: Terminal, color: 'text-cyan-500', bg: 'bg-cyan-500/10', lang: 'Go' },
      { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10', lang: 'Rust' },
    ];
    return styles[index % styles.length];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Theme configuration
  const theme = {
    bg: darkMode ? 'bg-zinc-950' : 'bg-slate-50',
    text: darkMode ? 'text-zinc-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-slate-500',
    border: darkMode ? 'border-zinc-800' : 'border-slate-200',
    cardBg: darkMode ? 'bg-zinc-900/50' : 'bg-white',
    cardHover: darkMode ? 'hover:bg-zinc-900' : 'hover:bg-slate-50',
    sidebarBg: darkMode ? 'bg-zinc-950/95' : 'bg-white/90',
    inputBg: darkMode ? 'bg-zinc-900' : 'bg-white',
    inputBorder: darkMode ? 'border-transparent' : 'border-slate-200',
    accent: 'text-emerald-500',
    accentBg: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-400',
    shadowGlow: darkMode ? 'shadow-emerald-500/20' : 'shadow-slate-300/50',
    cardShadowHover: darkMode ? 'hover:shadow-emerald-500/10' : 'hover:shadow-slate-200',
  };

  // Render Content based on Active Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'team':
        return (
          <TeamView 
            theme={theme} 
            darkMode={darkMode} 
            invites={invites}
            onRespond={handleInviteResponse}
          />
        );
      case 'deploy':
        return <DeploymentsView theme={theme} darkMode={darkMode} />;
      case 'settings':
        return <SettingsView theme={theme} darkMode={darkMode} />;
      case 'dashboard':
      case 'projects':
      default:
        return (
          <>
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {activeTab === 'dashboard' ? 'Dashboard' : 'My Projects'}
                </h1>
                <p className={theme.textMuted}>
                  {activeTab === 'dashboard' ? 'Overview of your recent activity.' : 'Manage your coding projects.'}
                </p>
              </div>
              <button 
                disabled={isCreating}
                onClick={handleCreateProject}
                className={`${theme.accentBg} ${theme.accentHover} ${darkMode ? 'text-zinc-950' : 'text-white'} font-bold px-4 py-2.5 rounded-xl flex items-center shadow-lg ${theme.shadowGlow} transition-all active:scale-95 disabled:opacity-50`}
              >
                {isCreating ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Plus className="w-5 h-5 mr-2" />}
                {isCreating ? 'Creating...' : 'New Project'}
              </button>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Create New Card */}
              {(activeFilter === 'All Projects' || activeFilter === 'Recent') && (
                <button 
                  onClick={handleCreateProject}
                  disabled={isCreating}
                  className={`group h-48 rounded-2xl border-2 border-dashed ${darkMode ? 'border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/30' : 'border-slate-300 hover:border-emerald-500/50 hover:bg-slate-50'} flex flex-col items-center justify-center transition-all duration-300`}
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                     {isCreating ? <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /> : <Plus className="w-6 h-6 text-emerald-500" />}
                  </div>
                  <span className={`font-medium ${theme.text}`}>Create new workspace</span>
                </button>
              )}

              {/* Projects */}
              {!isLoading && projects.map((project, index) => {
                const style = getProjectStyle(index);
                const Icon = style.icon;
                return (
                  <div 
                    key={project._id || project.id} 
                    onClick={() => navigate(`/code-editor/${project._id || project.id}`)}
                    className={`group relative h-48 rounded-2xl p-5 border ${theme.border} ${theme.cardBg} hover:shadow-xl ${theme.cardShadowHover} transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-lg ${style.bg} ${style.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex space-x-1">
                             <MoreVertical className={`w-5 h-5 ${theme.textMuted}`} />
                          </div>
                        </div>
                        <h3 className="font-bold text-lg mb-1 truncate">{project.title || project.name}</h3>
                        <p className={`text-xs ${theme.textMuted} font-mono flex items-center`}>
                          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'} mr-2`}></span>
                          {style.lang} • {formatDate(project.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans transition-colors duration-300 flex overflow-hidden`}>
      
      {/* Sidebar */}
      <aside className={`w-20 lg:w-64 border-r ${theme.border} ${theme.sidebarBg} backdrop-blur-xl flex flex-col justify-between transition-all duration-300 z-20`}>
        <div>
          <div className={`h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b ${theme.border}`}>
            <div className={`bg-gradient-to-tr from-emerald-400 to-emerald-600 p-2 rounded-lg shadow-lg`}>
              <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className={`ml-3 font-bold text-lg hidden lg:block tracking-tight`}>
              Sync<span className="text-emerald-500">Code</span>
            </span>
          </div>
          <nav className="p-4 space-y-2">
            <NavItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} theme={theme} />
            <NavItem icon={Folder} label="My Projects" active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setActiveFilter('All Projects'); }} theme={theme} />
            {/* Added a dot to the Users icon if there are invites */}
            <div className="relative">
                <NavItem icon={Users} label="Shared with me" active={activeTab === 'team'} onClick={() => setActiveTab('team')} theme={theme} />
                {invites.length > 0 && <span className="absolute top-2 left-6 w-2 h-2 bg-red-500 rounded-full border border-black"></span>}
            </div>
            <NavItem icon={Globe} label="Deployments" active={activeTab === 'deploy'} onClick={() => setActiveTab('deploy')} theme={theme} />
          </nav>
        </div>
        <div className={`p-4 border-t ${theme.border} space-y-2`}>
          <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} theme={theme} />
          <NavItem icon={LogOut} label="Sign Out" theme={theme} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className={`h-16 border-b ${theme.border} ${theme.sidebarBg} backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-10`}>
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted} group-focus-within:text-emerald-500 transition-colors`} />
              <input type="text" placeholder="Search..." className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm ${theme.inputBg} border ${theme.inputBorder} focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-500 shadow-sm`} />
            </div>
          </div>

          <div className="flex items-center space-x-3 ml-4">
            {/* NOTIFICATION BELL */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg hover:bg-zinc-500/10 transition-colors relative`}
                >
                    <Bell className={`w-5 h-5 ${theme.textMuted}`} />
                    {invites.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-transparent animate-pulse"></span>
                    )}
                </button>
                
                {/* NOTIFICATION DROPDOWN */}
                {showNotifications && (
                    <div className={`absolute right-0 top-12 w-80 rounded-xl border ${theme.border} ${theme.cardBg} shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                        <div className={`p-3 border-b ${theme.border} font-semibold text-sm`}>
                            Notifications
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {invites.length === 0 ? (
                                <div className={`p-8 text-center text-sm ${theme.textMuted}`}>No new notifications</div>
                            ) : (
                                invites.map((invite) => (
                                    <div key={invite.projectId} className={`p-4 border-b ${theme.border} hover:bg-zinc-500/5 transition-colors`}>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Invitation to <strong>{invite.projectName}</strong></p>
                                                <p className={`text-xs ${theme.textMuted} mt-1`}>Role: {invite.role}</p>
                                                <div className="flex gap-2 mt-3">
                                                    <button 
                                                        onClick={() => handleInviteResponse(invite.projectId, 'accepted')}
                                                        className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button 
                                                        onClick={() => handleInviteResponse(invite.projectId, 'rejected')}
                                                        className={`flex-1 py-1.5 border ${theme.border} hover:bg-zinc-500/10 text-xs font-medium rounded-lg transition-colors`}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={`h-6 w-px ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'} mx-2`}></div>
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-yellow-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200'}`}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// --- SUB COMPONENT: UPDATED TEAM VIEW (COLLABORATION) ---

function TeamView({ theme, darkMode, invites, onRespond }) {
  // We can also have a "Joined Projects" list here later.
  // For now, we focus on the pending invites as requested.

  return (
    <div className="max-w-4xl animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Collaboration</h1>
            <p className={`${theme.textMuted}`}>Manage project invitations and team access.</p>
        </div>
      </div>

      {/* 1. Pending Invitations Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-500" />
            Pending Invitations ({invites.length})
        </h2>

        {invites.length === 0 ? (
             <div className={`p-8 rounded-2xl border border-dashed ${theme.border} ${theme.cardBg} text-center`}>
                <p className={theme.textMuted}>You have no pending invitations at the moment.</p>
             </div>
        ) : (
            <div className={`grid gap-4`}>
                {invites.map((invite) => (
                    <div key={invite.projectId} className={`p-5 rounded-2xl border ${theme.border} ${theme.cardBg} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                        <div className="flex items-start gap-4">
                             <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20`}>
                                {invite.projectName.substring(0, 2).toUpperCase()}
                             </div>
                             <div>
                                <h3 className="font-bold text-lg">{invite.projectName}</h3>
                                <div className={`flex items-center gap-3 text-sm ${theme.textMuted} mt-1`}>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Owner ID: {invite.ownerId.substring(0,6)}...
                                    </span>
                                    <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
                                    <span className="flex items-center gap-1 capitalize text-emerald-500">
                                        <Zap className="w-3 h-3" /> {invite.role} Access
                                    </span>
                                </div>
                                <p className={`text-xs ${theme.textMuted} mt-2 flex items-center gap-1`}>
                                    <Clock className="w-3 h-3" /> Invited {new Date(invite.sentAt).toLocaleDateString()}
                                </p>
                             </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => onRespond(invite.projectId, 'rejected')}
                                className={`px-4 py-2 rounded-xl border ${theme.border} hover:bg-zinc-500/10 font-medium text-sm transition-colors flex items-center gap-2`}
                            >
                                <XCircle className="w-4 h-4" /> Reject
                            </button>
                            <button 
                                onClick={() => onRespond(invite.projectId, 'accepted')}
                                className={`px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2`}
                            >
                                <CheckCircle className="w-4 h-4" /> Accept Invite
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
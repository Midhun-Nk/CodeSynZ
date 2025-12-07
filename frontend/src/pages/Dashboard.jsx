import React, { useState, useEffect, useContext } from 'react';
import { 
  Search, Bell, Plus, LayoutGrid, Folder, Users, Settings, LogOut, 
  Sun, Moon, MoreVertical, Terminal, Code2, Cpu, Globe, Zap, Hash,
  Loader2, Mail, Trash2, X, Type, FileText, Filter,ChevronDown, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SettingsView } from '../components/dashboard/SettingsView';
import { DeploymentsView } from '../components/dashboard/DeploymentsView';
import { NavItem } from '../components/dashboard/NavItem';
import CollabrationInvitations from '../components/dashboard/CollabrationInvitations';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

// --- CONFIG ---
const API_URL = BACKEND_URL;

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
  const LANGUAGE_OPTIONS = [
  { name: 'Node.js', icon: Hash, color: 'text-green-500', bg: 'bg-green-500/10' },
  { name: 'React', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Python', icon: Cpu, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { name: 'Go', icon: Terminal, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { name: 'Rust', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { name: 'HTML/CSS', icon: Globe, color: 'text-pink-500', bg: 'bg-pink-500/10' },
];
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('dashboard');
  // 1. NEW STATE FOR LANGUAGE
const [newProjectLang, setNewProjectLang] = useState(LANGUAGE_OPTIONS[0]); // Default to Node.js
const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [activeMenuId, setActiveMenuId] = useState(null);
const {logout} = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [invites, setInvites] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const {  darkMode,
        toggleTheme,
        dashboardTheme } = useTheme();
  
  const token = localStorage.getItem('token');

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        setCurrentUser(JSON.parse(user));
      } 
      setIsLoading(true);
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

  // --- LOGIC: FILTER PROJECTS ---
  const getFilteredProjects = () => {
    let filtered = [...projects];
    const userId = currentUser?.id || currentUser?._id;

    if (activeTab === 'projects') {
      return filtered.filter(p => p.owner === userId || p.owner?._id === userId || p.isOwner);
    }

    if (activeFilter === 'Owned') {
      filtered = filtered.filter(p => p.owner === userId || p.owner?._id === userId || p.isOwner);
    } else if (activeFilter === 'Shared') {
      filtered = filtered.filter(p => (p.owner !== userId && p.owner?._id !== userId) && !p.isOwner);
    }

    if (activeFilter === 'Recent') {
      filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    return filtered;
  };

  // --- HANDLERS ---
  const handleInviteResponse = async (projectId, status) => {
    try {
      await apiCall(`/projects/${projectId}/invite/respond`, 'POST', { status });
      setInvites(prev => prev.filter(i => i.projectId !== projectId));
      if (status === 'accepted') {
        const updatedProjects = await apiCall('/projects');
        setProjects(updatedProjects);
      }
      toast.success(`Invite ${status} successfully.`);
    } catch (error) {
      toast.error(`Error responding to invite: ${error.message}`);
    }
  };
const handleCreateProject = () => {
  setNewProjectName('');
  setNewProjectDesc('');
  setNewProjectLang(LANGUAGE_OPTIONS[0]); // Reset language to default
  setShowCreateModal(true);
};

const submitCreateProject = async () => {
  if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
  }
  try {
    setIsCreating(true);
    const newProject = await apiCall('/projects', 'POST', { 
      name: newProjectName,
      description: newProjectDesc || "No description provided",
      language: newProjectLang.name // <--- SEND LANGUAGE TO API
    });
    setShowCreateModal(false); 
    navigate(`/code-editor/${newProject._id}`); 
  } catch (error) {
    toast.error("Error creating project: " + error.message);
  } finally {
    setIsCreating(false);
  }
};
// 2. UPDATED HELPER: Get style based on language name instead of index
const getProjectStyle = (languageName) => {
  const found = LANGUAGE_OPTIONS.find(l => l.name === languageName);
  // Fallback to the first option if language isn't found (or for old projects)
  return found || LANGUAGE_OPTIONS[0];
};
  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
        await apiCall(`/projects/${projectId}`, 'DELETE');
        setProjects(prev => prev.filter(p => (p._id || p.id) !== projectId));
    } catch (error) {
        toast.error("Failed to delete project: " + error.message);
    }
    setActiveMenuId(null);
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24)); 
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // const theme = {
  //   bg: darkMode ? 'bg-zinc-950' : 'bg-slate-50',
  //   text: darkMode ? 'text-zinc-100' : 'text-slate-900',
  //   textMuted: darkMode ? 'text-zinc-400' : 'text-slate-500',
  //   border: darkMode ? 'border-zinc-800' : 'border-slate-200',
  //   cardBg: darkMode ? 'bg-zinc-900/50' : 'bg-white',
  //   cardHover: darkMode ? 'hover:bg-zinc-900' : 'hover:bg-slate-50',
  //   sidebarBg: darkMode ? 'bg-zinc-950/95' : 'bg-white/90',
  //   inputBg: darkMode ? 'bg-zinc-900' : 'bg-white',
  //   inputBorder: darkMode ? 'border-transparent' : 'border-slate-200',
  //   accent: 'text-emerald-500',
  //   accentBg: 'bg-emerald-500',
  //   accentHover: 'hover:bg-emerald-400',
  //   shadowGlow: darkMode ? 'shadow-emerald-500/20' : 'shadow-slate-300/50',
  //   cardShadowHover: darkMode ? 'hover:shadow-emerald-500/10' : 'hover:shadow-slate-200',
  // };

  const renderContent = () => {
    if (activeTab === 'team') return <CollabrationInvitations theme={dashboardTheme} darkMode={darkMode} invites={invites} onRespond={handleInviteResponse} />;
    if (activeTab === 'deploy') return <DeploymentsView theme={dashboardTheme} darkMode={darkMode} />;
    if (activeTab === 'settings') return <SettingsView currentUser={currentUser} theme={dashboardTheme} darkMode={darkMode} token={token} />;

    const displayedProjects = getFilteredProjects();

    return (
      <>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {activeTab === 'dashboard' ? 'Dashboard' : 'My Projects'}
            </h1>
            <p className={dashboardTheme.textMuted}>
              {activeTab === 'dashboard' ? 'Manage your workspaces.' : 'Your personal project repository.'}
            </p>
          </div>
          
          <button 
            disabled={isCreating}
            onClick={handleCreateProject}
            className={`${dashboardTheme.accentBg} ${dashboardTheme.accentHover} ${darkMode ? 'text-zinc-950' : 'text-white'} font-bold px-4 py-2.5 rounded-xl flex items-center shadow-lg ${dashboardTheme.shadowGlow} transition-all active:scale-95 disabled:opacity-50`}
          >
            {isCreating ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Plus className="w-5 h-5 mr-2" />}
            {isCreating ? 'Creating...' : 'New Project'}
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <Filter className={`w-4 h-4 ${dashboardTheme.textMuted} mr-2`} />
            {['All', 'Recent', 'Owned', 'Shared'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                  activeFilter === filter 
                    ? `${dashboardTheme.accentBg} ${darkMode ? 'text-black' : 'text-white'} border-transparent` 
                    : `${dashboardTheme.cardBg} ${dashboardTheme.textMuted} ${dashboardTheme.border} hover:border-emerald-500/50`
                }`}
              >
                {filter === 'Owned' ? 'My Projects' : filter === 'Shared' ? 'Collaborations' : filter}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(activeFilter === 'All' || activeFilter === 'Recent') && (
            <button 
              onClick={handleCreateProject}
              disabled={isCreating}
              className={`group h-56 rounded-2xl border-2 border-dashed ${darkMode ? 'border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/30' : 'border-slate-300 hover:border-emerald-500/50 hover:bg-slate-50'} flex flex-col items-center justify-center transition-all duration-300`}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {isCreating ? <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /> : <Plus className="w-6 h-6 text-emerald-500" />}
              </div>
              <span className={`font-medium ${dashboardTheme.text}`}>Create new workspace</span>
            </button>
          )}

          {!isLoading && displayedProjects.map((project, index) => {
const style = getProjectStyle(project.language); 
  const Icon = style.icon;
  const projectId = project._id || project.id;
            
            return (
              <div 
                key={projectId} 
                onClick={() => navigate(`/code-editor/${projectId}`)}
                className={`group relative h-56 rounded-2xl p-5 border ${dashboardTheme.border} ${dashboardTheme.cardBg} hover:shadow-xl ${dashboardTheme.cardShadowHover} transition-all duration-300 hover:-translate-y-1 overflow-visible cursor-pointer`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`} />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg ${style.bg} ${style.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === projectId ? null : projectId);
                            }}
                            className={`p-1 rounded-md hover:bg-zinc-500/20 transition-colors`}
                        >
                            <MoreVertical className={`w-5 h-5 ${dashboardTheme.textMuted}`} />
                        </button>
                        {activeMenuId === projectId && (
                            <div className={`absolute right-0 top-8 w-40 rounded-xl border ${dashboardTheme.border} ${dashboardTheme.cardBg} shadow-xl z-50 overflow-hidden`}>
                                {project.isOwner ? (
                                    <button 
                                        onClick={(e) => handleDeleteProject(e, projectId)}
                                        className="w-full text-left px-4 py-3 text-red-500 hover:bg-red-500/10 flex items-center gap-2 text-sm transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                ) : (
                                    <div className={`px-4 py-3 text-xs ${dashboardTheme.textMuted} text-center`}>Shared Project</div>
                                )}
                            </div>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1 truncate">{project.title || project.name}</h3>
                    <p className={`text-sm ${dashboardTheme.textMuted} line-clamp-2 leading-relaxed h-10`}>
                      {project.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-500/10 flex justify-between items-center">
                    <span className={`text-xs ${dashboardTheme.textMuted} font-mono flex items-center`}>
                      <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'} mr-2`}></span>
                      {style.lang}
                    </span>
                    <span className={`text-xs ${dashboardTheme.textMuted}`}>{formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    // FIX 1: Change min-h-screen to h-screen
    <div className={`h-screen ${dashboardTheme.bg} ${dashboardTheme.text} font-sans transition-colors duration-300 flex overflow-hidden`}>
      
      {/* Sidebar - FIX 2: Ensure h-full is applied explicitly */}
      <aside className={`w-20 lg:w-64 border-r ${dashboardTheme.border} ${dashboardTheme.sidebarBg} backdrop-blur-xl flex flex-col justify-between transition-all duration-300 z-20 h-full`}>
        <div>
          <div className={`h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b ${dashboardTheme.border}`}>
            <div className={`bg-gradient-to-tr from-emerald-400 to-emerald-600 p-2 rounded-lg shadow-lg`}>
              <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className={`ml-3 font-bold text-lg hidden lg:block tracking-tight`}>
              Sync<span className="text-emerald-500">Code</span>
            </span>
          </div>
          <nav className="p-4 space-y-2">
            <NavItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setActiveFilter('All'); }} theme={dashboardTheme} />
            <NavItem icon={Folder} label="My Projects" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} theme={dashboardTheme} />
            <div className="relative">
                <NavItem icon={Users} label="Shared with me" active={activeTab === 'team'} onClick={() => setActiveTab('team')} theme={dashboardTheme} />
                {invites.length > 0 && <span className="absolute top-2 left-6 w-2 h-2 bg-red-500 rounded-full border border-black"></span>}
            </div>
            <NavItem icon={Globe} label="Deployments" active={activeTab === 'deploy'} onClick={() => setActiveTab('deploy')} theme={dashboardTheme} />
          </nav>
        </div>
        
        {/* Footer (Settings & Sign Out) - Now guaranteed to stay at bottom of viewport */}
        <div className={`p-4 border-t ${dashboardTheme.border} space-y-2`}>
          <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} theme={dashboardTheme} />
          <NavItem icon={LogOut} label="Sign Out" theme={dashboardTheme} onClick={logout} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className={`h-16 border-b ${dashboardTheme.border} ${dashboardTheme.sidebarBg} backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-10 shrink-0`}>
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dashboardTheme.textMuted} group-focus-within:text-emerald-500 transition-colors`} />
              <input type="text" placeholder="Search..." className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm ${dashboardTheme.inputBg} border ${dashboardTheme.inputBorder} focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-500 shadow-sm`} />
            </div>
          </div>
          <div className="flex items-center space-x-3 ml-4">
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg hover:bg-zinc-500/10 transition-colors relative`}
                >
                    <Bell className={`w-5 h-5 ${dashboardTheme.textMuted}`} />
                    {invites.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-transparent animate-pulse"></span>
                    )}
                </button>
                {showNotifications && (
                    <div className={`absolute right-0 top-12 w-80 rounded-xl border ${dashboardTheme.border} ${dashboardTheme.cardBg} shadow-2xl z-50 overflow-hidden`}>
                        <div className={`p-3 border-b ${dashboardTheme.border} font-semibold text-sm`}>Notifications</div>
                        <div className="max-h-96 overflow-y-auto">
                            {invites.length === 0 ? (
                                <div className={`p-8 text-center text-sm ${dashboardTheme.textMuted}`}>No new notifications</div>
                            ) : (
                                invites.map((invite) => (
                                    <div key={invite.projectId} className={`p-4 border-b ${dashboardTheme.border}`}>
                                        <p className="text-sm font-medium">Invitation to <strong>{invite.projectName}</strong></p>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => handleInviteResponse(invite.projectId, 'accepted')} className="flex-1 py-1 bg-emerald-500 text-white text-xs rounded">Accept</button>
                                            <button onClick={() => handleInviteResponse(invite.projectId, 'rejected')} className={`flex-1 py-1 border ${dashboardTheme.border} text-xs rounded`}>Decline</button>
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-0">
          {renderContent()}
        </div>
      </main>

      {/* CREATE MODAL */}
   {/* CREATE MODAL */}
{showCreateModal && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className={`${dashboardTheme.sidebarBg} border ${dashboardTheme.border} p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className={`text-xl font-bold ${dashboardTheme.text}`}>Create New Project</h3>
          <p className={`text-xs ${dashboardTheme.textMuted} mt-1`}>Initialize a new workspace environment.</p>
        </div>
        <button onClick={() => setShowCreateModal(false)} className={`p-2 rounded-full hover:bg-zinc-500/10 ${dashboardTheme.textMuted}`}>
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-5">
        
        {/* Project Name Input */}
        <div className="space-y-2">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dashboardTheme.textMuted} ml-1`}>Project Name</label>
          <div className={`flex items-center px-4 py-3 rounded-xl border ${dashboardTheme.border} ${dashboardTheme.inputBg} focus-within:ring-2 ring-emerald-500/50`}>
            <Type className={`w-4 h-4 mr-3 ${dashboardTheme.textMuted}`} />
            <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g. AI Chatbot" className={`flex-1 bg-transparent outline-none ${dashboardTheme.text}`} autoFocus />
          </div>
        </div>

        {/* --- NEW LANGUAGE DROPDOWN --- */}
        <div className="space-y-2 relative">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dashboardTheme.textMuted} ml-1`}>Tech Stack</label>
          <button 
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${dashboardTheme.border} ${dashboardTheme.inputBg} hover:border-emerald-500/50 transition-colors`}
          >
            <div className="flex items-center">
              <div className={`p-1.5 rounded-md ${newProjectLang.bg} ${newProjectLang.color} mr-3`}>
                <newProjectLang.icon className="w-4 h-4" />
              </div>
              <span className={dashboardTheme.text}>{newProjectLang.name}</span>
            </div>
            <ChevronDown className={`w-4 h-4 ${dashboardTheme.textMuted} transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isLangDropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-2 p-1 rounded-xl border ${dashboardTheme.border} ${dashboardTheme.cardBg} shadow-xl z-50 max-h-48 overflow-y-auto`}>
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => {
                    setNewProjectLang(opt);
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'}`}
                >
                  <div className="flex items-center">
                    <div className={`p-1.5 rounded-md ${opt.bg} ${opt.color} mr-3`}>
                      <opt.icon className="w-4 h-4" />
                    </div>
                    <span className={`text-sm ${dashboardTheme.text}`}>{opt.name}</span>
                  </div>
                  {newProjectLang.name === opt.name && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* ----------------------------- */}

        {/* Description Input */}
        <div className="space-y-2">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dashboardTheme.textMuted} ml-1`}>Description</label>
          <div className={`flex items-start px-4 py-3 rounded-xl border ${dashboardTheme.border} ${dashboardTheme.inputBg} focus-within:ring-2 ring-emerald-500/50`}>
            <FileText className={`w-4 h-4 mr-3 mt-1 ${dashboardTheme.textMuted}`} />
            <textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} placeholder="Details..." rows="3" className={`flex-1 bg-transparent outline-none ${dashboardTheme.text} resize-none`} />
          </div>
        </div>

        <button onClick={submitCreateProject} disabled={isCreating} className={`w-full ${dashboardTheme.accentBg} hover:bg-emerald-400 text-zinc-950 font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center mt-2 transition-all active:scale-95`}>
          {isCreating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {isCreating ? 'Creating Workspace...' : 'Create Project'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
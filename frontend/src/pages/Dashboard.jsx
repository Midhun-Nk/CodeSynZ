import React, { useState } from 'react';
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
  Clock,
  Star,
  Archive,
  CheckCircle,
  AlertCircle,
  GitBranch
} from 'lucide-react';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFilter, setActiveFilter] = useState('All Projects');

  const toggleTheme = () => setDarkMode(!darkMode);

  // Theme configuration
  const theme = {
    // Base Colors
    bg: darkMode ? 'bg-zinc-950' : 'bg-slate-50',
    text: darkMode ? 'text-zinc-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-slate-500',
    border: darkMode ? 'border-zinc-800' : 'border-slate-200',
    
    // Components
    cardBg: darkMode ? 'bg-zinc-900/50' : 'bg-white',
    cardHover: darkMode ? 'hover:bg-zinc-900' : 'hover:bg-slate-50',
    sidebarBg: darkMode ? 'bg-zinc-950/95' : 'bg-white/90',
    
    // Inputs
    inputBg: darkMode ? 'bg-zinc-900' : 'bg-white',
    inputBorder: darkMode ? 'border-transparent' : 'border-slate-200',
    
    // Actions & Accents
    accent: 'text-emerald-500',
    accentBg: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-400',
    
    // Shadows (Dynamic based on mode)
    shadowGlow: darkMode ? 'shadow-emerald-500/20' : 'shadow-slate-300/50',
    cardShadowHover: darkMode ? 'hover:shadow-emerald-500/10' : 'hover:shadow-slate-200',
  };

  // Enhanced Mock Data
  const projects = [
    { id: 1, title: 'E-Commerce API', lang: 'Node.js', icon: Hash, color: 'text-green-500', bg: 'bg-green-500/10', updated: '2m ago', users: 3, isFavorite: true, isArchived: false, category: 'Backend' },
    { id: 2, title: 'Portfolio Site', lang: 'React', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-500/10', updated: '1h ago', users: 1, isFavorite: false, isArchived: false, category: 'Frontend' },
    { id: 3, title: 'Neural Net Viz', lang: 'Python', icon: Cpu, color: 'text-yellow-500', bg: 'bg-yellow-500/10', updated: '2d ago', users: 0, isFavorite: true, isArchived: false, category: 'AI/ML' },
    { id: 4, title: 'Chat Server', lang: 'Go', icon: Terminal, color: 'text-cyan-500', bg: 'bg-cyan-500/10', updated: '5d ago', users: 2, isFavorite: false, isArchived: true, category: 'Backend' },
    { id: 5, title: 'Crypto Bot', lang: 'Rust', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10', updated: '1w ago', users: 4, isFavorite: true, isArchived: false, category: 'Finance' },
  ];

  // Filter Logic
  const getFilteredProjects = () => {
    switch (activeFilter) {
      case 'Recent':
        return [...projects].sort((a, b) => a.updated.localeCompare(b.updated)).filter(p => !p.isArchived); // Simple mock sort
      case 'Favorites':
        return projects.filter(p => p.isFavorite && !p.isArchived);
      case 'Archived':
        return projects.filter(p => p.isArchived);
      default: // All Projects
        return projects.filter(p => !p.isArchived);
    }
  };

  // Render Content based on Active Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'team':
        return <TeamView theme={theme} darkMode={darkMode} />;
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
                  {activeTab === 'dashboard' 
                    ? 'Overview of your recent activity and workspaces.' 
                    : 'Manage and organize all your coding projects.'}
                </p>
              </div>
              <button className={`${theme.accentBg} ${theme.accentHover} ${darkMode ? 'text-zinc-950' : 'text-white'} font-bold px-4 py-2.5 rounded-xl flex items-center shadow-lg ${theme.shadowGlow} transition-all active:scale-95`}>
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </button>
            </div>

            {/* Quick Stats / Filters */}
            <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {['All Projects', 'Recent', 'Favorites', 'Archived'].map((filter) => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                    activeFilter === filter 
                      ? `${darkMode ? 'bg-zinc-800/50' : 'bg-white'} text-emerald-500 border-emerald-500/30 shadow-sm` 
                      : `${theme.cardBg} ${theme.textMuted} ${theme.border} hover:border-zinc-400`
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Create New Card (Dashed) - Only show on All or Recent */}
              {(activeFilter === 'All Projects' || activeFilter === 'Recent') && (
                <button className={`group h-48 rounded-2xl border-2 border-dashed ${darkMode ? 'border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/30' : 'border-slate-300 hover:border-emerald-500/50 hover:bg-slate-50'} flex flex-col items-center justify-center transition-all duration-300`}>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-emerald-500" />
                  </div>
                  <span className={`font-medium ${theme.text}`}>Create new workspace</span>
                  <span className={`text-xs ${theme.textMuted} mt-1`}>Start from scratch or import</span>
                </button>
              )}

              {/* Project Cards */}
              {getFilteredProjects().map((project) => (
                <div key={project.id} className={`group relative h-48 rounded-2xl p-5 border ${theme.border} ${theme.cardBg} hover:shadow-xl ${theme.cardShadowHover} transition-all duration-300 hover:-translate-y-1 overflow-hidden`}>
                  
                  {/* Hover Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${project.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${project.bg} ${project.color}`}>
                          <project.icon className="w-5 h-5" />
                        </div>
                        <div className="flex space-x-1">
                           {project.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                           <button className={`${theme.textMuted} hover:text-emerald-500 transition-colors`}>
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-lg mb-1">{project.title}</h3>
                      <p className={`text-xs ${theme.textMuted} font-mono flex items-center`}>
                        <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-zinc-600' : 'bg-slate-300'} mr-2`}></span>
                        {project.lang} • {project.updated}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-500/10 pt-4">
                      <div className="flex -space-x-2">
                        {[...Array(project.users)].map((_, i) => (
                          <div key={i} className={`w-7 h-7 rounded-full ${darkMode ? 'bg-zinc-800 ring-zinc-900' : 'bg-slate-100 ring-white'} ring-2 flex items-center justify-center text-[10px] font-bold`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className={`p-1.5 rounded-lg hover:bg-zinc-500/10 transition-colors ${project.color}`}>
                          <Zap className="w-4 h-4" />
                        </button>
                        <button className={`p-1.5 rounded-lg hover:bg-zinc-500/10 transition-colors ${theme.textMuted}`}>
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans selection:bg-emerald-500/30 selection:text-emerald-200 transition-colors duration-300 flex overflow-hidden`}>
      
      {/* Sidebar Navigation */}
      <aside className={`w-20 lg:w-64 border-r ${theme.border} ${theme.sidebarBg} backdrop-blur-xl flex flex-col justify-between transition-all duration-300 z-20`}>
        <div>
          {/* Logo Area */}
          <div className={`h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b ${theme.border}`}>
            <div className={`bg-gradient-to-tr from-emerald-400 to-emerald-600 p-2 rounded-lg shadow-lg ${darkMode ? 'shadow-emerald-500/20' : 'shadow-slate-300/50'}`}>
              <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className={`ml-3 font-bold text-lg hidden lg:block tracking-tight`}>
              Sync<span className="text-emerald-500">Code</span>
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2">
            <NavItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} theme={theme} />
            <NavItem icon={Folder} label="My Projects" active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setActiveFilter('All Projects'); }} theme={theme} />
            <NavItem icon={Users} label="Shared with me" active={activeTab === 'team'} onClick={() => setActiveTab('team')} theme={theme} />
            <NavItem icon={Globe} label="Deployments" active={activeTab === 'deploy'} onClick={() => setActiveTab('deploy')} theme={theme} />
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className={`p-4 border-t ${theme.border} space-y-2`}>
          <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} theme={theme} />
          <NavItem icon={LogOut} label="Sign Out" theme={theme} />
          
          {/* User Profile Snippet */}
          <div className={`mt-4 flex items-center p-2 rounded-xl ${darkMode ? 'bg-zinc-900/50' : 'bg-slate-100'} cursor-pointer transition-colors`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/20">
              JD
            </div>
            <div className="ml-3 hidden lg:block overflow-hidden">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className={`text-xs ${theme.textMuted} truncate`}>Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 bg-emerald-500/20`} />
          <div className={`absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-20 bg-violet-600/10`} />
        </div>

        {/* Top Header */}
        <header className={`h-16 border-b ${theme.border} ${theme.sidebarBg} backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-10`}>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted} group-focus-within:text-emerald-500 transition-colors`} />
              <input 
                type="text" 
                placeholder="Search projects, commands, or files..." 
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm ${theme.inputBg} border ${theme.inputBorder} focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-zinc-500 shadow-sm`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <kbd className={`hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border ${darkMode ? 'border-zinc-700 bg-zinc-800 text-zinc-400' : 'border-slate-300 bg-slate-100 text-slate-500'}`}>⌘K</kbd>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3 ml-4">
            <button className={`p-2 rounded-lg hover:bg-zinc-500/10 transition-colors relative`}>
              <Bell className={`w-5 h-5 ${theme.textMuted}`} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-transparent"></span>
            </button>
            <div className={`h-6 w-px ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'} mx-2`}></div>
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-yellow-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// --- Sub Components for Pages ---

function TeamView({ theme, darkMode }) {
  const team = [
    { name: 'Alice Chen', role: 'Frontend Lead', status: 'Online', avatar: 'AC' },
    { name: 'Bob Smith', role: 'Backend Dev', status: 'In Meeting', avatar: 'BS' },
    { name: 'Charlie Kim', role: 'DevOps', status: 'Offline', avatar: 'CK' },
  ];

  return (
    <div className="max-w-4xl animate-fade-in-up">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Team Members</h1>
      <p className={`${theme.textMuted} mb-8`}>Manage collaborators and permissions.</p>

      <div className={`border ${theme.border} rounded-2xl overflow-hidden ${theme.cardBg} shadow-sm`}>
        {team.map((member, i) => (
          <div key={i} className={`p-4 flex items-center justify-between border-b ${theme.border} last:border-0 hover:bg-zinc-500/5 transition-colors`}>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                {member.avatar}
              </div>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className={`text-xs ${theme.textMuted}`}>{member.role}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`text-xs px-2 py-1 rounded-full ${member.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                {member.status}
              </span>
              <button className={`p-2 rounded-lg hover:bg-zinc-500/10 ${theme.textMuted}`}>
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeploymentsView({ theme, darkMode }) {
  const deployments = [
    { name: 'e-commerce-api-prod', commit: '8a2b9f', time: '2m ago', status: 'Live', branch: 'main' },
    { name: 'portfolio-v2-dev', commit: '4c3d1e', time: '1h ago', status: 'Building', branch: 'develop' },
  ];

  return (
    <div className="max-w-4xl animate-fade-in-up">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Deployments</h1>
      <p className={`${theme.textMuted} mb-8`}>Track your active builds and environments.</p>

      <div className="space-y-4">
        {deployments.map((deploy, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${theme.border} ${theme.cardBg} flex items-center justify-between shadow-sm`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${deploy.status === 'Live' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">{deploy.name}</h3>
                <div className={`flex items-center space-x-3 text-xs ${theme.textMuted} mt-1`}>
                  <span className="flex items-center"><GitBranch className="w-3 h-3 mr-1" /> {deploy.branch}</span>
                  <span>•</span>
                  <span className="font-mono">{deploy.commit}</span>
                  <span>•</span>
                  <span>{deploy.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {deploy.status === 'Live' ? (
                <span className="flex items-center text-emerald-500 text-sm font-medium"><CheckCircle className="w-4 h-4 mr-1.5" /> Live</span>
              ) : (
                <span className="flex items-center text-yellow-500 text-sm font-medium animate-pulse"><AlertCircle className="w-4 h-4 mr-1.5" /> Building...</span>
              )}
              <button className={`px-3 py-1.5 rounded-lg border ${theme.border} text-sm hover:bg-zinc-500/5`}>
                Logs
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ theme, darkMode }) {
  return (
    <div className="max-w-2xl animate-fade-in-up">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
      <p className={`${theme.textMuted} mb-8`}>Manage your account preferences and workspace configuration.</p>

      <div className={`space-y-6 ${theme.text}`}>
        <div className={`p-6 rounded-2xl border ${theme.border} ${theme.cardBg} shadow-sm`}>
          <h3 className="text-lg font-bold mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>First Name</label>
                <input type="text" defaultValue="John" className={`w-full p-2.5 rounded-xl ${theme.inputBg} border ${theme.border} focus:outline-none focus:border-emerald-500 shadow-sm`} />
              </div>
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>Last Name</label>
                <input type="text" defaultValue="Doe" className={`w-full p-2.5 rounded-xl ${theme.inputBg} border ${theme.border} focus:outline-none focus:border-emerald-500 shadow-sm`} />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>Email</label>
              <input type="email" defaultValue="john.doe@example.com" className={`w-full p-2.5 rounded-xl ${theme.inputBg} border ${theme.border} focus:outline-none focus:border-emerald-500 shadow-sm`} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${theme.border} ${theme.cardBg} shadow-sm`}>
          <h3 className="text-lg font-bold mb-4">Notifications</h3>
          <div className="space-y-3">
            {['Email notifications for comments', 'Desktop notifications for builds', 'Weekly digest'].map((item, i) => (
              <label key={i} className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" defaultChecked className={`w-4 h-4 rounded border-zinc-400 text-emerald-500 focus:ring-emerald-500 ${darkMode ? 'bg-zinc-800' : 'bg-white'}`} />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.textMuted} hover:text-zinc-500`}>Cancel</button>
          <button className={`px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 ${darkMode ? 'text-zinc-950' : 'text-white'} hover:bg-emerald-400 shadow-lg ${theme.shadowGlow}`}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// Helper NavItem
function NavItem({ icon: Icon, label, active, onClick, theme }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-emerald-500/10 text-emerald-500' 
          : `${theme.textMuted} hover:bg-zinc-500/5 hover:text-zinc-500`
      }`}
    >
      <Icon className={`w-5 h-5 lg:mr-3 ${active ? 'text-emerald-500' : ''}`} />
      <span className="hidden lg:block font-medium text-sm">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 hidden lg:block" />}
    </button>
  );
}
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from "react";
import {
  Search,
  Settings,
  MoreVertical,
  Code2,
  GitBranch,
  FileCode,
  File,
  FileJson,
  ChevronRight,
  ChevronDown,
  X,
  FolderPlus,
  FilePlus,
  Sun,
  Moon,
  Hash,
  Terminal as TerminalIcon,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  Check,
  Play,
  Loader2,
  Package,
  Shield,
  UserMinus,
  MoreHorizontal,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  FileText,
  LogOut
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { CodeContext } from "../context/CodeContext";

// --- CONFIG ---
const API_URL = "http://localhost:4000/api";
const SOCKET_URL = "http://localhost:4000";

// --- CUSTOM THEME MATCHING LOGIN PAGE (Zinc + Emerald) ---
const zincEmeraldTheme = EditorView.theme(
  {
    "&": {
      color: "#e4e4e7", // Zinc-200
      backgroundColor: "#09090b", // Zinc-950 (Opaque for readability)
    },
    ".cm-content": { caretColor: "#10b981" }, // Emerald-500 Caret
    "&.cm-focused .cm-cursor": { borderLeftColor: "#10b981" },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(16, 185, 129, 0.25)", // Emerald selection
    },
    ".cm-gutters": {
      backgroundColor: "#09090b", // Zinc-950
      color: "#52525b", // Zinc-600
      borderRight: "1px solid #27272a", // Zinc-800
    },
    ".cm-activeLineGutter": { backgroundColor: "rgba(16, 185, 129, 0.1)" },
    ".cm-line": { paddingLeft: "8px" },
  },
  { dark: true }
);

export default function CodeEditor() {
  const {
    apiCall,
    handleSendInvite,
    handleRequestAccess,
    handleAccessRequestAction,
    handleLeaveProject,
    handleRemoveMember,
    handleRename,
    handleDelete,
    runProject,
    runCode,
  } = useContext(CodeContext);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const PROJECT_ID = projectId;

  const [darkMode, setDarkMode] = useState(true);

  // -- Identity State --
  const [currentUser, setCurrentUser] = useState({
    name: "Loading...",
    color: "#888",
  });
  const [currentUserId, setCurrentUserId] = useState(null);

  // -- File System State --
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- Navigation State --
  const [activeFileId, setActiveFileId] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarView, setSidebarView] = useState("explorer");
  const [editingId, setEditingId] = useState(null);
  const [creatingType, setCreatingType] = useState(null);

  // -- Access Control State --
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [amIOwner, setAmIOwner] = useState(false);

  // -- Terminal / Execution State --
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: "info", content: "SyncCode Terminal v2.0 (Emerald Edition)" },
    { type: "info", content: "Connecting to server..." },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // -- Collaboration State --
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);

  // -- Invite Modal State --
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isInviting, setIsInviting] = useState(false);

  const socketRef = useRef(null);

  // --- THEME CONFIGURATION (Matches Login Page) ---
  const theme = {
    // Glassmorphism backgrounds
    appBg: darkMode ? "bg-zinc-950/80" : "bg-zinc-50/80", 
    sidebarBg: darkMode ? "bg-zinc-900/60" : "bg-white/60",
    activityBarBg: darkMode ? "bg-zinc-900/40" : "bg-zinc-50/40",
    terminalBg: darkMode ? "bg-zinc-900/90" : "bg-white/90",
    
    // Borders & Text
    border: darkMode ? "border-zinc-800" : "border-zinc-200",
    text: darkMode ? "text-zinc-300" : "text-zinc-700",
    textActive: darkMode ? "text-zinc-100" : "text-zinc-900",
    textMuted: darkMode ? "text-zinc-500" : "text-zinc-400",
    
    // Interactive
    hoverBg: darkMode ? "hover:bg-zinc-800/50" : "hover:bg-zinc-200/50",
    inputBg: darkMode ? "bg-zinc-900/50" : "bg-white/50",
    
    // Accents
    accent: "text-emerald-500",
    accentBg: "bg-emerald-500",
    accentBorder: "border-emerald-500",
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  // --- IDENTITY & INIT LOGIC (Condensed for brevity, same as before) ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id || payload._id);
        setCurrentUser((prev) => ({ ...prev, name: payload.username || "User" }));
      } catch (e) { console.error("Invalid token"); }
    }
  }, []);

  // Mock API call simulation for UI demo
  useEffect(() => {
     if(currentUserId && PROJECT_ID) {
         apiCall(`/projects/${PROJECT_ID}/files`).then(res => { setFiles(res); setLoading(false); }).catch(() => setLoading(false));
         setAmIOwner(true); 
     }
  }, [currentUserId, PROJECT_ID, apiCall]);

  const findFileById = (list, id) => {
    for (const item of list) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFileById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // --- HANDLERS ---
  const handleFileSelect = (id, type) => {
    setSelectedId(id);
    if (type === "file") {
      if (!openFiles.includes(id)) setOpenFiles([...openFiles, id]);
      setActiveFileId(id);
    }
  };
  const handleTabClick = (id) => { setActiveFileId(id); setSelectedId(id); };
  const handleCloseTab = (e, id) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter((fileId) => fileId !== id);
    setOpenFiles(newOpenFiles);
    if (activeFileId === id) {
       setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };
  const handleToggleFolder = (id) => {
    const toggleRecursive = (list) => list.map((item) => {
      if (item.id === id) return { ...item, isOpen: !item.isOpen };
      if (item.children) return { ...item, children: toggleRecursive(item.children) };
      return item;
    });
    setFiles((prev) => toggleRecursive(prev));
  };
  const handleCreateItem = (type) => {
      setCreatingType(type);
      setEditingId("temp_1"); 
  };
  const handleCodeChange = (code) => { /* Update Logic */ };

  const activeFile = findFileById(files, activeFileId);

  if (loading)
    return (
      <div className={`h-screen flex items-center justify-center bg-zinc-950 text-emerald-500`}>
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-zinc-400 animate-pulse font-mono">Initializing SyncCode Environment...</p>
        </div>
      </div>
    );

  return (
    <div className={`h-screen w-full flex flex-col ${darkMode ? 'text-zinc-200' : 'text-zinc-800'} overflow-hidden font-sans text-sm relative selection:bg-emerald-500/30 selection:text-emerald-200`}>
      
      {/* --- BACKGROUND DECOR (From Login Page) --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-zinc-950">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse ${darkMode ? 'opacity-100' : 'opacity-60'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse delay-700 ${darkMode ? 'opacity-100' : 'opacity-60'}`} />
        <div className={`absolute top-[20%] right-[20%] w-[20%] h-[20%] rounded-full blur-[80px] bg-zinc-800/20`} />
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
      </div>

      {/* --- INVITE MODAL --- */}
      {showInviteModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme.sidebarBg} backdrop-blur-xl border ${theme.border} p-8 rounded-2xl shadow-2xl w-[28rem] animate-in fade-in zoom-in duration-200`}>
             {/* ... Modal Content same as before but using theme colors ... */}
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${theme.textActive}`}>Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className={`p-2 rounded-full ${theme.hoverBg}`}><X className="w-5 h-5 opacity-70" /></button>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider opacity-60 ml-1">Email</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} outline-none focus:ring-2 ring-emerald-500/50`} placeholder="dev@example.com" />
              </div>
              <button onClick={() => handleSendInvite(inviteEmail, inviteRole, PROJECT_ID, setPendingInvites, setInviteEmail, setShowInviteModal, setIsInviting)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                 {isInviting ? <Loader2 className="animate-spin" /> : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP BAR (Glassmorphic) --- */}
      <div className={`h-16 border-b ${theme.border} ${theme.sidebarBg} backdrop-blur-md flex items-center justify-between px-6 select-none relative z-20`}>
        {/* Brand */}
        <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-emerald-400 to-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
             </div>
             <span className="font-bold text-lg tracking-tight text-zinc-100">
                Sync<span className="text-emerald-500">Code</span>
             </span>
        </div>

        {/* Center Search */}
        <div className="hidden lg:flex items-center w-1/3">
             <div className={`flex items-center w-full px-4 py-2 rounded-xl border ${theme.border} ${theme.inputBg} opacity-80 hover:opacity-100 transition-all group`}>
                <Search className="w-4 h-4 opacity-40 group-hover:text-emerald-400 transition-colors mr-3" />
                <span className="text-sm opacity-50 flex-1 truncate text-center">{activeFile ? activeFile.name : "Search files..."}</span>
             </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
             {/* Run Buttons */}
             <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
                <button
                    onClick={() => runCode(activeFile, setIsRunning, setShowTerminal, setTerminalOutput)}
                    disabled={isRunning || !activeFile}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                >
                    {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>Run</span>
                </button>
             </div>
             
             {/* Profile/Toggle */}
             <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20 ring-2 ring-zinc-950">
                    {currentUser.name[0]}
                 </div>
                 <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center ${theme.inputBg} border ${theme.border} hover:scale-105 transition-transform`}>
                    {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
                 </button>
             </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden z-10">
        
        {/* --- ACTIVITY BAR (Left) --- */}
        <div className={`w-16 border-r ${theme.border} ${theme.activityBarBg} backdrop-blur-md flex flex-col items-center py-6 gap-4`}>
          <ActivityIcon icon={FileCode} active={sidebarView === "explorer"} onClick={() => setSidebarView("explorer")} theme={theme} />
          <ActivityIcon icon={Users} active={sidebarView === "collab"} onClick={() => setSidebarView("collab")} notification={pendingInvites.length} theme={theme} />
          <div className="flex-1" />
          <ActivityIcon icon={Settings} theme={theme} />
          <button onClick={() => { localStorage.removeItem('token'); navigate('/'); }} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mb-2">
            <LogOut className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        {/* --- SIDEBAR PANEL (Glassy) --- */}
        <div className={`w-72 border-r ${theme.border} ${theme.sidebarBg} backdrop-blur-md flex flex-col transition-all duration-300`}>
          {sidebarView === "explorer" && (
            <>
              <div className="h-14 flex items-center justify-between px-5">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60 text-emerald-500">Explorer</span>
                <MoreVertical className="w-4 h-4 opacity-50" />
              </div>
              <div className="px-4 pb-2">
                 <div className="flex items-center justify-between group py-2 px-2 rounded-lg hover:bg-zinc-500/5 cursor-pointer">
                     <div className="flex items-center font-bold text-sm text-zinc-200">
                         <ChevronDown className="w-4 h-4 mr-2 text-emerald-500" />
                         <span className="truncate">{projectId || "Project Root"}</span>
                     </div>
                     <div className="flex opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                        <button onClick={() => handleCreateItem("file")} className="p-1 hover:text-emerald-400"><FilePlus className="w-4 h-4" /></button>
                        <button onClick={() => handleCreateItem("folder")} className="p-1 hover:text-emerald-400"><FolderPlus className="w-4 h-4" /></button>
                     </div>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                <FileTree items={files} activeId={activeFileId} selectedId={selectedId} editingId={editingId} collaborators={onlineUsers} onToggle={handleToggleFolder} onSelect={handleFileSelect} onRename={handleRename} onDelete={handleDelete} setEditingId={setEditingId} theme={theme} />
              </div>
            </>
          )}

          {sidebarView === "collab" && (
             <div className="flex flex-col h-full">
                <div className="p-5">
                    <h2 className="font-bold text-lg mb-1 text-emerald-400">Team</h2>
                    <p className="text-xs opacity-50">Real-time collaborators</p>
                </div>
                {/* ... Collab List Logic ... */}
                <div className="px-4 space-y-2">
                     {projectMembers.map(m => (
                         <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                             <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white border border-zinc-600">{m.name[0]}</div>
                             <div className="flex-1 min-w-0">
                                 <div className="text-sm font-medium truncate text-zinc-300">{m.name}</div>
                                 <div className="text-[10px] text-emerald-500">{m.role}</div>
                             </div>
                             <div className={`w-2 h-2 rounded-full ${onlineUsers.find(u=>u.id===m.id) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-zinc-600'}`}></div>
                         </div>
                     ))}
                </div>
             </div>
          )}
        </div>

        {/* --- MAIN EDITOR AREA --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-hidden">
          
          {/* Tabs */}
          <div className={`flex items-end ${theme.activityBarBg} backdrop-blur-md h-10 flex-shrink-0 select-none border-b ${theme.border}`}>
            {openFiles.map((fileId) => {
              const file = findFileById(files, fileId);
              if (!file) return null;
              return <Tab key={file.id} name={file.name} active={activeFileId === file.id} theme={theme} onClick={() => handleTabClick(file.id)} onClose={(e) => handleCloseTab(e, file.id)} />;
            })}
          </div>

          {/* Breadcrumbs */}
          <div className={`h-8 border-b ${theme.border} bg-zinc-950/40 backdrop-blur-sm flex items-center px-4 gap-2 text-xs text-zinc-500`}>
             <span>{projectId}</span> <ChevronRight className="w-3 h-3" /> <span>src</span> <ChevronRight className="w-3 h-3" /> <span className="text-emerald-400">{activeFile?.name}</span>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex overflow-hidden relative min-h-0 bg-zinc-950"> 
            {/* Note: bg-zinc-950 is used here to ensure code is readable over the abstract background */}
            {activeFile ? (
              <>
                <div className="flex-1 relative h-full">
                  <EditorArea theme={theme} darkMode={darkMode} code={activeFile.content} onChange={handleCodeChange} onCursorChange={() => {}} />
                </div>
                {/* Minimap Overlay */}
                <div className={`w-16 border-l ${theme.border} bg-zinc-950/50 hidden md:block opacity-50`}>
                    <div className="text-[2px] leading-[3px] p-2 text-emerald-500/50 font-mono whitespace-pre">{activeFile.content}</div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none">
                 <div className="w-32 h-32 bg-emerald-500/5 rounded-full flex items-center justify-center mb-6 border border-emerald-500/10 animate-pulse">
                    <Code2 className="w-16 h-16 text-emerald-500/40" />
                 </div>
                 <h2 className="text-xl font-bold mb-2 text-zinc-300">No file open</h2>
              </div>
            )}
          </div>

          {/* Terminal (Bottom) */}
          {showTerminal && (
            <div className={`h-64 border-t ${theme.border} ${theme.terminalBg} backdrop-blur-xl flex flex-col font-mono text-xs flex-shrink-0 animate-in slide-in-from-bottom duration-300`}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex space-x-4">
                    <span className="font-bold border-b-2 border-emerald-500 pb-2 -mb-2.5 text-emerald-400">TERMINAL</span>
                </div>
                <button onClick={() => setShowTerminal(false)}><X className="w-4 h-4 hover:text-white" /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-1 font-mono text-zinc-300">
                {terminalOutput.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-emerald-500">➜</span>
                    <span className={log.type === 'error' ? 'text-red-400' : ''}>{log.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="h-7 bg-emerald-600/90 backdrop-blur text-white flex items-center px-4 justify-between text-[10px] font-bold tracking-wide select-none z-20">
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> main*</div>
             </div>
             <div className="flex items-center gap-4">
                 <div onClick={() => setShowTerminal(!showTerminal)} className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 rounded"><TerminalIcon className="w-3 h-3" /> TERMINAL</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white animate-pulse"></div> ONLINE</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ADAPTED FOR THEME ---

function ActivityIcon({ icon: Icon, active, notification, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 relative group transition-all duration-300 rounded-xl mx-2 ${
        active ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
      }`}
    >
      <Icon className="w-6 h-6" strokeWidth={1.5} />
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full -ml-3 shadow-[0_0_8px_#10b981]" />}
      {notification > 0 && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-violet-500 rounded-full border border-zinc-900 animate-ping" />}
    </button>
  );
}

function Tab({ name, active, theme, onClick, onClose }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 h-full min-w-[140px] max-w-[200px] border-r border-transparent text-xs cursor-pointer select-none relative group transition-all duration-200 ${
        active
          ? `bg-zinc-900/40 text-emerald-400 border-t-2 border-t-emerald-500`
          : `opacity-60 hover:opacity-100 hover:bg-zinc-800/30 text-zinc-400`
      }`}
    >
      <FileIcon name={name} className="mr-2.5 w-4 h-4" />
      <span className="truncate flex-1 font-medium">{name}</span>
      <button onClick={onClose} className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-all ml-1`}><X className="w-3 h-3" /></button>
    </div>
  );
}

function FileTree({ items, level = 0, activeId, selectedId, editingId, collaborators = [], onToggle, onSelect, onRename, onDelete, setEditingId, theme }) {
  return items.map((item) => (
      <div key={item.id}>
        <div
          className={`flex items-center py-1.5 px-2 cursor-pointer transition-all duration-200 text-sm select-none rounded-lg mx-2 my-0.5 ${
            item.id === selectedId || item.id === activeId ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => item.type === "folder" ? (onToggle(item.id), onSelect(item.id, "folder")) : onSelect(item.id, "file")}
        >
          <span className="mr-2">
            {item.type === "folder" ? (
              <Folder className={`w-4 h-4 ${item.isOpen ? 'text-emerald-500' : 'text-zinc-500'}`} />
            ) : (
              <FileIcon name={item.name} className="w-4 h-4" />
            )}
          </span>
          {editingId === item.id ? (
            <input autoFocus className="bg-zinc-800 text-white border border-emerald-500 rounded px-2 py-0.5 outline-none w-full text-sm" defaultValue={item.name} onKeyDown={(e) => { if(e.key === 'Enter') onRename(item.id, e.currentTarget.value) }} onBlur={(e) => onRename(item.id, e.currentTarget.value)} />
          ) : (
            <div className="flex-1 flex justify-between items-center overflow-hidden group">
              <span className="truncate">{item.name || "Untitled"}</span>
              <div className="hidden group-hover:flex items-center gap-1 mr-1">
                <button className="hover:text-emerald-400 p-1" onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}><Edit2 className="w-3 h-3" /></button>
                <button className="hover:text-red-400 p-1" onClick={(e) => onDelete(e, item.id)}><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          )}
        </div>
        {item.type === "folder" && item.isOpen && item.children && <FileTree items={item.children} level={level + 1} activeId={activeId} selectedId={selectedId} editingId={editingId} collaborators={collaborators} onToggle={onToggle} onSelect={onSelect} onRename={onRename} onDelete={onDelete} setEditingId={setEditingId} theme={theme} />}
      </div>
  ));
}

const FileIcon = ({ name, className }) => {
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'jsx' || ext === 'tsx' || ext === 'react') return <FileCode className={`${className} text-cyan-400`} />;
    if (ext === 'js') return <FileJson className={`${className} text-yellow-400`} />;
    if (ext === 'html') return <FileCode className={`${className} text-orange-500`} />;
    if (ext === 'css') return <Hash className={`${className} text-blue-400`} />;
    if (ext === 'py') return <FileCode className={`${className} text-blue-300`} />;
    return <File className={`${className} text-zinc-500`} />;
};

function EditorArea({ theme, darkMode, code, onChange, onCursorChange }) {
  const handleChange = useCallback((val) => onChange(val), [onChange]);
  return (
    <div className="relative h-full overflow-hidden text-base">
      <CodeMirror
        value={code}
        height="100%"
        theme={darkMode ? zincEmeraldTheme : "light"}
        extensions={[javascript({ jsx: true }), python()]}
        onChange={handleChange}
        onUpdate={(v) => { if(v.selectionSet) onCursorChange(); }}
        className="h-full font-mono text-[14px]"
      />
    </div>
  );
}
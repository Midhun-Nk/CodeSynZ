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
  Zap,
  FileCode,
  File,
  FileJson,
  ChevronRight,
  ChevronDown,
  X,
  FolderPlus,
  FilePlus,
  Menu,
  Sun,
  Moon,
  Hash,
  Terminal as TerminalIcon,
  Layout,
  Bell,
  AlertCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  Check,
  Ban,
  MousePointer2,
  Share2,
  Play,
  Loader2,
  LogOut,
  Package,
  Shield,
  UserMinus,
  MoreHorizontal,
  CheckCircle2,
  CloudRain,
  Folder,
  FolderOpen,
  
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CodeContext } from "../context/CodeContext";

// --- CONFIG ---
const SOCKET_URL = "http://localhost:4000";

// --- THEME DEFINITION ---
// --- THEME DEFINITION (Refined for Modern Look) ---
const githubDarkTheme = EditorView.theme(
  {
    "&": { color: "#e4e4e7", backgroundColor: "#18181b" }, // Zinc-900 bg
    ".cm-content": { caretColor: "#10b981" }, // Blue caret
    "&.cm-focused .cm-cursor": { borderLeftColor: "#10b981" },
    "&.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(16, 185, 129, 0.3)", // Transparent blue selection
    },
    ".cm-gutters": {
      backgroundColor: "#18181b",
      color: "#52525b", // Zinc-600
      borderRight: "1px solid #27272a", // Zinc-800
    },
    ".cm-activeLineGutter": { backgroundColor: "rgba(59, 130, 246, 0.1)" },
    ".cm-line": { paddingLeft: "8px" }, // More breathing room
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
    handleRoleChange,
    handleRename,
    handleDelete,runProject,runCode,getAllFiles
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
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [accessRequestSent, setAccessRequestSent] = useState(false);
  const [amIOwner, setAmIOwner] = useState(false);

  // -- Terminal / Execution State --
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: "info", content: "SyncCode Terminal v1.0.0" },
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
  const saveTimeoutRef = useRef(null);
  const isRemoteUpdate = useRef(false); // Prevents echo loop
  const lastCursorEmit = useRef(0); // For throttling cursor updates

  // Theme configuration
   // --- MODERN THEME PALETTE ---
  const theme = {
    bg: darkMode ? "bg-zinc-950/80" : "bg-zinc-50/80",
    sidebarBg: darkMode ? "bg-zinc-900" : "bg-white",
    activityBarBg: darkMode ? "bg-zinc-900" : "bg-gray-100",
    text: darkMode ? "text-zinc-300" : "text-gray-700",
    textActive: darkMode ? "text-white" : "text-black",
    border: darkMode ? "border-zinc-800" : "border-gray-200",
    tabActiveBg: darkMode ? "bg-zinc-950" : "bg-white",
    tabInactiveBg: darkMode ? "bg-zinc-900/50" : "bg-gray-100",
    inputBg: darkMode ? "bg-zinc-800" : "bg-white",
    inputText: darkMode ? "text-white" : "text-black",
    terminalBg: darkMode ? "bg-[#18181b]" : "bg-white",
    hoverBg: darkMode ? "hover:bg-white/5" : "hover:bg-black/5",
    accent: "text-emerald-500",
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  // --------------------------------------------------------------------------
  // IDENTITY SETUP (Extract ID from Token)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id || payload._id);
        setCurrentUser((prev) => ({
          ...prev,
          name: payload.username || "User",
        }));
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  // -- Helpers --
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


  // --------------------------------------------------------------------------
  // INITIAL LOAD & SOCKET
  // --------------------------------------------------------------------------
  // --- INITIAL DATA FETCH & SOCKET ---
  useEffect(() => {
    const init = async () => {
      try {
        const fileTree = await apiCall(`/projects/${PROJECT_ID}/files`);
        setFiles(fileTree);
        setLoading(false);

        const project = await apiCall(`/projects/${PROJECT_ID}`);
        setAmIOwner(String(project.owner._id) === String(currentUserId));

        const membersList = [
          {
            id: project.owner._id,
            name: project.owner.username,
            email: project.owner.email,
            role: "owner",
            color: project.owner.avatarColor,
          },
        ];
        if (project.collaborators) {
          project.collaborators.forEach((c) => {
            membersList.push({
              id: c.id,
              name: c.name,
              email: c.email,
              role: c.role,
              color: c.color,
            });
          });
        }
        setProjectMembers(membersList);

        if (project.invitations)
          setPendingInvites(
            project.invitations.map((inv, idx) => ({
              id: inv._id || idx,
              email: inv.email,
              role: inv.role,
            }))
          );
        if (project.accessRequests) setAccessRequests(project.accessRequests);
      } catch (err) {
        if (err.message.toLowerCase().includes("access denied")) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }
        console.error("Load error", err);
        setLoading(false);
      }
    };

    if (currentUserId) init();

    // SOCKET SETUP
    const token = localStorage.getItem("token");
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("join-room", {
        roomId: PROJECT_ID,
        userName: currentUser.name,
        color: currentUser.color,
      });
    });

    // GLITCH FIX: Handle Code Updates safely
    socket.on("code-update", ({ fileId, code }) => {
      // 1. Mark this as a remote update so onChange doesn't echo it back
      if (fileId === activeFileId) {
        isRemoteUpdate.current = true;
      }

      setFiles((prev) => {
        const updateRecursive = (list) =>
          list.map((item) => {
            if (item.id === fileId) return { ...item, content: code };
            if (item.children)
              return { ...item, children: updateRecursive(item.children) };
            return item;
          });
        return updateRecursive(prev);
      });
    });

    socket.on("cursor-update", ({ id, cursor, fileId }) => {
      if (id === socket.id) return; // Don't track own cursor from server
      setOnlineUsers((prev) => {
        const exists = prev.find((u) => u.id === id);
        if (exists)
          return prev.map((u) => (u.id === id ? { ...u, cursor, fileId } : u));
        return prev; // Wait for join event to add user
      });
    });

    socket.on("user-joined", (user) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u.id === user.id)) return prev;
        return [...prev, user];
      });
      setTerminalOutput((prev) => [
        ...prev,
        { type: "info", content: `> ${user.name} joined.` },
      ]);
    });

    socket.on("sync-users", (users) => {
      // Filter out self from online users to avoid drawing own cursor
      setOnlineUsers(users.filter((u) => u.id !== socket.id));
    });

    socket.on("user-left", (socketId) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== socketId));
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, PROJECT_ID, currentUserId, activeFileId]);

  // --- HANDLERS ---

  // GLITCH FIX: Throttle Cursor & Prevent Echo Loop
  const handleCodeChange = useCallback(
    (newContent) => {
      // 1. If this change came from the server (remote), ignore emitting
      if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
      }

      // 2. Update Local State
      const updateContentRecursive = (list) =>
        list.map((item) => {
          if (item.id === activeFileId) return { ...item, content: newContent };
          if (item.children)
            return { ...item, children: updateContentRecursive(item.children) };
          return item;
        });
      setFiles((prev) => updateContentRecursive(prev));

      // 3. Emit to Server
      if (socketRef.current)
        socketRef.current.emit("code-change", {
          roomId: PROJECT_ID,
          fileId: activeFileId,
          code: newContent,
        });

      // 4. Debounce DB Save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await apiCall(
            `/projects/${PROJECT_ID}/files/${activeFileId}/content`,
            "PUT",
            { content: newContent }
          );
        } catch (err) {}
      }, 2000); // Increased debounce to 2s to reduce DB load
    },
    [activeFileId, PROJECT_ID]
  );

  // GLITCH FIX: Throttle Cursor
  const handleLocalCursor = useCallback(
    (cursorPos) => {
      const now = Date.now();
      // Only emit cursor every 50ms
      if (now - lastCursorEmit.current > 50) {
        if (socketRef.current)
          socketRef.current.emit("cursor-move", {
            roomId: PROJECT_ID,
            fileId: activeFileId,
            cursor: cursorPos,
          });
        lastCursorEmit.current = now;
      }
    },
    [activeFileId, PROJECT_ID]
  );

  // --- UTILS ---
  const handleFileSelect = (id, type) => {
    setSelectedId(id);
    if (type === "file") {
      if (!openFiles.includes(id)) setOpenFiles([...openFiles, id]);
      setActiveFileId(id);
    }
  };

  const handleTabClick = (id) => {
    setActiveFileId(id);
    setSelectedId(id);
  };
  const handleCloseTab = (e, id) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter((fileId) => fileId !== id);
    setOpenFiles(newOpenFiles);
    if (activeFileId === id) {
      if (newOpenFiles.length > 0) {
        const nextId = newOpenFiles[newOpenFiles.length - 1];
        setActiveFileId(nextId);
        setSelectedId(nextId);
      } else {
        setActiveFileId(null);
        setSelectedId(null);
      }
    }
  };
  const handleToggleFolder = (id) => {
    const toggleRecursive = (list) =>
      list.map((item) => {
        if (item.id === id) return { ...item, isOpen: !item.isOpen };
        if (item.children)
          return { ...item, children: toggleRecursive(item.children) };
        return item;
      });
    setFiles((prev) => toggleRecursive(prev));
  };

  const handleCreateItem = (type) => {
    const tempId = "temp_" + Date.now();
    setCreatingType(type);
    const newItem = {
      id: tempId,
      name: "",
      type: type,
      content: "",
      children: type === "folder" ? [] : undefined,
      isOpen: true,
      isTemp: true,
    };
    let inserted = false;
    const addItemRecursive = (list) =>
      list.map((item) => {
        if (item.id === selectedId && item.type === "folder") {
          inserted = true;
          return {
            ...item,
            isOpen: true,
            children: [newItem, ...(item.children || [])],
          };
        }
        if (item.children)
          return { ...item, children: addItemRecursive(item.children) };
        return item;
      });
    let newFiles = addItemRecursive(files);
    if (!inserted) newFiles = [...newFiles, newItem];
    setFiles(newFiles);
    setEditingId(tempId);
  };

  const activeFile = findFileById(files, activeFileId);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  if (loading)
    return (
      <div className={`h-screen flex items-center justify-center ${theme.bg} ${theme.text}`}>
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-lg font-medium animate-pulse">Initializing Environment...</p>
        </div>
      </div>
    );


  if (!isAuthorized) {
    return (
      <div
        className={`h-screen flex flex-col items-center justify-center ${theme.bg} ${theme.text} animate-fade-in`}
      >
        <div
          className={`max-w-md w-full p-8 rounded-2xl border ${theme.border} ${theme.sidebarBg} shadow-2xl text-center`}
        >
          <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
          <p className="opacity-60 mb-8 text-sm">
            You do not have permission to view this project.
          </p>
          {accessRequestSent ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
              <span className="font-bold text-green-500">Request Sent!</span>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() =>
                  handleRequestAccess(
                    PROJECT_ID,
                    setIsRequestingAccess,
                    setAccessRequestSent
                  )
                }
                disabled={isRequestingAccess}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isRequestingAccess ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}{" "}
                Request Permission
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full py-3 rounded-xl hover:bg-gray-500/10 transition-colors text-xs font-medium opacity-60 hover:opacity-100"
              >
                Go Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
   <div className={`h-screen flex flex-col ${theme.bg} ${theme.text} overflow-hidden font-sans text-sm relative selection:bg-blue-500/30`}>
      {/* Invite Modal */}
     {showInviteModal && (
           <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className={`${theme.sidebarBg} border ${theme.border} p-8 rounded-2xl shadow-2xl w-[28rem] animate-in fade-in zoom-in duration-200`}>
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className={`text-xl font-bold ${theme.textActive}`}>Invite Team Member</h3>
                   <p className="text-xs opacity-60 mt-1">Collaborate in real-time with your team.</p>
                 </div>
                 <button onClick={() => setShowInviteModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                   <X className="w-5 h-5 opacity-70" />
                 </button>
               </div>
               {/* Modal Inputs (Same Logic, Better UI) */}
               <div className="space-y-5">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold uppercase tracking-wider opacity-60 ml-1">Email Address</label>
                   <div className={`flex items-center px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} focus-within:ring-2 ring-blue-500/50 transition-all`}>
                     <Users className="w-4 h-4 mr-3 opacity-50" />
                     <input
                       type="email"
                       value={inviteEmail}
                       onChange={(e) => setInviteEmail(e.target.value)}
                       placeholder="developer@example.com"
                       className={`flex-1 bg-transparent outline-none ${theme.inputText} placeholder:opacity-30`}
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold uppercase tracking-wider opacity-60 ml-1">Role Permission</label>
                   <div className={`relative px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} focus-within:ring-2 ring-blue-500/50`}>
                     <select
                       value={inviteRole}
                       onChange={(e) => setInviteRole(e.target.value)}
                       className={`w-full bg-transparent outline-none appearance-none ${theme.inputText}`}
                     >
                       <option value="viewer">Viewer (Read Only)</option>
                       <option value="editor">Editor (Full Access)</option>
                     </select>
                     <ChevronDown className="w-4 h-4 absolute right-4 top-3.5 opacity-50 pointer-events-none" />
                   </div>
                 </div>
                 <button
                   onClick={() => handleSendInvite(inviteEmail, inviteRole, PROJECT_ID, setPendingInvites, setInviteEmail, setShowInviteModal, setIsInviting)}
                   disabled={isInviting}
                   className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center mt-2"
                 >
                   {isInviting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Share2 className="w-5 h-5 mr-2" />}
                   Send Invitation
                 </button>
               </div>
             </div>
           </div>
         )}

      {/* Top Bar */}
       <div className={`h-16 border-b ${theme.border} ${theme.sidebarBg} flex items-center justify-between px-6 select-none relative z-20 shadow-sm`}>
             
             {/* Left: Brand & Menu */}
             <div className="flex items-center space-x-6">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                     <Code2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                     SyncCode
                  </span>
               </div>
               <div className="h-6 w-px bg-white/10 mx-2"></div>
               <div className="flex items-center space-x-1">
                  {["File", "Edit", "View", "Go", "Help"].map(item => (
                     <button key={item} className="px-3 py-1.5 rounded-lg text-sm opacity-60 hover:opacity-100 hover:bg-white/5 transition-colors">
                         {item}
                     </button>
                  ))}
               </div>
             </div>
     
             {/* Center: Search / File Name */}
             <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex items-center justify-center w-1/3">
                  <div className={`flex items-center w-full max-w-md px-4 py-2 rounded-xl border ${theme.border} ${theme.inputBg} opacity-80 hover:opacity-100 transition-all group`}>
                     <Search className="w-4 h-4 opacity-40 group-hover:text-blue-400 transition-colors mr-3" />
                     <span className="text-sm opacity-50 flex-1 truncate text-center">
                         {activeFile ? activeFile.name : "Search files (Ctrl+P)"}
                     </span>
                     <span className="text-[10px] border border-white/10 px-1.5 rounded text-opacity-40 text-white">⌘P</span>
                  </div>
             </div>
     
             {/* Right: Actions & User */}
             <div className="flex items-center gap-4">
                  {/* Run Actions */}
                  <div className="flex items-center bg-zinc-800/50 p-1 rounded-lg border border-white/5">
                     <button
                         onClick={(e) => runCode(activeFile, setIsRunning, setShowTerminal, setTerminalOutput)}
                         disabled={isRunning || !activeFile}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-green-600/10 text-green-400 hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
                     >
                         {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                         <span>Run File</span>
                     </button>
                     <div className="w-px h-4 bg-white/10 mx-1"></div>
                     <button
                         onClick={(e) => runProject(files, activeFile, setIsRunning, setShowTerminal, setTerminalOutput)}
                         disabled={isRunning}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                     >
                         <Package className="w-3.5 h-3.5" />
                         <span>Run Project</span>
                     </button>
                  </div>
     
                  {/* Collaborators */}
                  <div className="flex items-center -space-x-2">
                      {onlineUsers.slice(0, 3).map((u) => (
                         <div key={u.id} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-gray-700 flex items-center justify-center text-xs font-bold text-white relative z-10" style={{backgroundColor: u.color}}>
                             {u.name[0]}
                         </div>
                      ))}
                      {onlineUsers.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-700 flex items-center justify-center text-xs font-bold text-white z-0">
                              +{onlineUsers.length - 3}
                          </div>
                      )}
                      <button onClick={() => setShowInviteModal(true)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-white/10 flex items-center justify-center text-white transition-colors ml-2">
                          <UserPlus className="w-4 h-4" />
                      </button>
                  </div>
                  
                  {/* Theme Toggle */}
                  <button onClick={toggleTheme} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                     {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                  </button>
             </div>
           </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
         <div
                  className={`w-16 border-r ${theme.border} ${theme.activityBarBg} flex flex-col items-center py-6 gap-4 z-10`}
                >
                  <ActivityIcon
                    icon={FileCode}
                    active={sidebarView === "explorer"}
                    onClick={() => setSidebarView("explorer")}
                    theme={theme}
                  />
                  <ActivityIcon
                    icon={Search}
                    active={sidebarView === "search"}
                    onClick={() => setSidebarView("search")}
                    theme={theme}
                  />
                  <ActivityIcon
                    icon={GitBranch}
                    active={sidebarView === "git"}
                    onClick={() => setSidebarView("git")}
                    theme={theme}
                  />
                  <ActivityIcon
                    icon={Users}
                    active={sidebarView === "collab"}
                    onClick={() => setSidebarView("collab")}
                    notification={pendingInvites.length + accessRequests.length}
                    theme={theme}
                  />
                  <div className="flex-1" />
                  <ActivityIcon icon={Settings} theme={theme} />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs mt-2 cursor-pointer shadow-md">
                    {currentUser.name[0]}
                  </div>
                </div>
        {/* Sidebar Content */}
        <div
          className={`w-72 border-r ${theme.border} ${theme.sidebarBg} flex flex-col transition-all duration-300`}
        >
         {sidebarView === "explorer" && (
                     <>
                       <div className="h-12 flex items-center justify-between px-5 border-b border-transparent">
                         <span className="text-xs font-bold uppercase tracking-widest opacity-60">
                           Explorer
                         </span>
                         <button className="opacity-50 hover:opacity-100 transition-opacity">
                           <MoreHorizontal className="w-4 h-4" />
                         </button>
                       </div>
         
                       {/* Project Title Area */}
                       <div className="px-4 pb-2">
                         <div className="flex items-center justify-between group py-2">
                           <div className="flex items-center font-bold text-sm">
                             <ChevronDown className="w-4 h-4 mr-1 opacity-70" />
                             <span className="truncate">
                               {'project' || "Untitled Project"}
                             </span>
                           </div>
                           <div className="flex opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                             <button
                               onClick={() => handleCreateItem("file")}
                               className="p-1 hover:bg-white/10 rounded transition-colors"
                             >
                               <FilePlus className="w-4 h-4 text-blue-400" />
                             </button>
                             <button
                               onClick={() => handleCreateItem("folder")}
                               className="p-1 hover:bg-white/10 rounded transition-colors"
                             >
                               <FolderPlus className="w-4 h-4 text-yellow-400" />
                             </button>
                           </div>
                         </div>
                       </div>
         
                       {/* File Tree List */}
                       <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                         <FileTree
                           items={files}
                           activeId={activeFileId}
                           selectedId={selectedId}
                           editingId={editingId}
                           collaborators={onlineUsers}
                           onToggle={handleToggleFolder}
                           onSelect={handleFileSelect}
                           onRename={(id, newName) =>
                             handleRename(
                               id,
                               newName,
                               PROJECT_ID,
                               files,
                               setFiles,
                               creatingType,
                               setCreatingType,
                               setEditingId,
                               handleFileSelect
                             )
                           }
                           onDelete={(e, id) =>
                             handleDelete(
                               e,
                               id,
                               PROJECT_ID,
                               files,
                               setFiles,
                               activeFileId,
                               handleCloseTab,
                               openFiles,
                               setOpenFiles
                             )
                           }
                           setEditingId={setEditingId}
                           theme={theme}
                         />
                       </div>
                     </>
                   )}
         
          {/* --- COLLABORATION SIDEBAR (Fixed) --- */}
           {sidebarView === "collab" && (
                  <div className="flex flex-col h-full">
                    <div className="p-5 border-b border-white/5">
                      <h2 className="font-bold text-lg mb-1">Collaborators</h2>
                      <p className="text-xs opacity-50">
                        Manage access and team members
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {/* Access Requests */}
                      {amIOwner && accessRequests.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-xs font-bold opacity-50 uppercase tracking-wider flex justify-between">
                            Requests{" "}
                            <span className="bg-red-500 text-white px-2 rounded-full text-[10px]">
                              {accessRequests.length}
                            </span>
                          </div>
                          {accessRequests.map((req) => (
                            <div
                              key={req._id}
                              className="p-3 bg-zinc-800/50 rounded-xl border border-orange-500/20 flex items-center justify-between"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {req.user?.username}
                                </span>
                                <span className="text-xs opacity-50">
                                  {req.user?.email}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleAccessRequestAction(
                                      req.user || { email: req.email },
                                      "approve",
                                      PROJECT_ID,
                                      setAccessRequests,
                                      setProjectMembers
                                    )
                                  }
                                  className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleAccessRequestAction(
                                      req.user || { email: req.email },
                                      "reject",
      
                                      PROJECT_ID,
                                      setAccessRequests,
                                      setProjectMembers
                                    )
                                  }
                                  className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
      
                      {/* 2. PENDING INVITES */}
                      <div>
                        <div className="text-[10px] font-bold opacity-50 mb-2 px-2 flex justify-between">
                          <span>PENDING INVITES</span>
                          <span className="bg-blue-600 text-white px-1.5 rounded-full">
                            {pendingInvites.length}
                          </span>
                        </div>
                        {pendingInvites.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-gray-500/10 group mb-1"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium truncate">
                                {inv.email}
                              </span>
                              <span className="text-[9px] text-blue-400 capitalize">
                                {inv.role}
                              </span>
                            </div>
                            <span className="text-[9px] opacity-40 italic">
                              Waiting
                            </span>
                          </div>
                        ))}
                        {pendingInvites.length === 0 && (
                          <span className="px-2 text-xs opacity-30 italic">
                            No pending invites
                          </span>
                        )}
                      </div>
      
                      <div className="h-px bg-gray-500/20"></div>
      
                      {/* Team List */}
                      <div className="space-y-3">
                        <div className="text-xs font-bold opacity-50 uppercase tracking-wider">
                          Online Members
                        </div>
                        {projectMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex flex-col p-2 rounded hover:bg-gray-500/10 group mb-1"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                                  {member.name ? member.name[0].toUpperCase() : "U"}
                                </div>
                                <span className="truncate font-medium">
                                  {member.name || member.email}
                                </span>
                              </div>
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  onlineUsers.find((u) => u.name === member.name)
                                    ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"
                                    : "bg-gray-600"
                                }`}
                                title={
                                  onlineUsers.find((u) => u.name === member.name)
                                    ? "Online"
                                    : "Offline"
                                }
                              ></div>
                            </div>
      
                            {/* ROLE MANAGEMENT & LEAVE/KICK LOGIC */}
                            <div className="flex items-center justify-between pl-7">
                              {member.role === "owner" ? (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> Owner
                                </span>
                              ) : (
                                <div className="flex items-center space-x-2 w-full">
                                  {/* Role Dropdown - ONLY VISIBLE TO OWNER */}
                                  {amIOwner ? (
                                    <div className="relative group/role">
                                      <select
                                        value={member.role}
                                        onChange={(e) =>
                                          handleRoleChange(
                                            member.id,
                                            e.target.value,
                                            PROJECT_ID,
                                            setProjectMembers,
                                            setOnlineUsers
                                          )
                                        }
                                        className={`appearance-none bg-transparent text-[10px] uppercase font-bold outline-none cursor-pointer ${
                                          member.role === "editor"
                                            ? "text-blue-400"
                                            : "text-gray-400"
                                        } hover:text-white transition-colors`}
                                      >
                                        <option
                                          value="viewer"
                                          className="bg-gray-900 text-gray-400"
                                        >
                                          Viewer
                                        </option>
                                        <option
                                          value="editor"
                                          className="bg-gray-900 text-blue-400"
                                        >
                                          Editor
                                        </option>
                                      </select>
                                    </div>
                                  ) : (
                                    <span
                                      className={`text-[10px] uppercase font-bold ${
                                        member.role === "editor"
                                          ? "text-blue-400"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {member.role}
                                    </span>
                                  )}
      
                                  <div className="flex-1"></div>
      
                                  {/* ACTIONS: KICK OR LEAVE */}
                                  {/* Case 1: Owner viewing others -> Show KICK */}
                                  {amIOwner && member.id !== currentUserId && (
                                    <button
                                      onClick={() =>
                                        handleRemoveMember(
                                          member.id,
                                          PROJECT_ID,
                                          setProjectMembers,
                                          setOnlineUsers
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-opacity"
                                      title="Remove from project"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  )}
      
                                  {/* Case 2: Collaborator viewing THEMSELVES -> Show LEAVE */}
                                  {!amIOwner && member.id === currentUserId && (
                                    <button
                                      onClick={() =>
                                        handleLeaveProject(
                                          PROJECT_ID,
                                          currentUserId,
                                          navigate
                                        )
                                      }
                                      className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                      title="Leave Project"
                                    >
                                      <LogOut className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

          {!["explorer", "collab"].includes(sidebarView) && (
            <div className="p-4 text-xs opacity-50 flex flex-col items-center justify-center h-full">
              Coming soon
            </div>
          )}
        </div>

        {/* Main Editor Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-hidden">
                 {/* Editor Tabs (Visual Studio Code Style) */}
                 <div
                   className={`flex items-end ${theme.activityBarBg} h-10 flex-shrink-0 select-none`}
                 >
                   {openFiles.map((fileId) => {
                     const file = findFileById(files, fileId);
                     if (!file) return null;
                     return (
                       <Tab
                         key={file.id}
                         name={file.name}
                         active={activeFileId === file.id}
                         theme={theme}
                         onClick={() => handleTabClick(file.id)}
                         onClose={(e) => handleCloseTab(e, file.id)}
                       />
                     );
                   })}
                 </div>
       
                 {/* Breadcrumbs & Actions Bar */}
                 <div
                   className={`h-8 border-b ${theme.border} ${theme.bg} flex items-center px-4 justify-between text-xs`}
                 >
                   <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                     <span>{projectId}</span>
                     <ChevronRight className="w-3 h-3" />
                     <span>src</span>
                     {activeFile && (
                       <>
                         <ChevronRight className="w-3 h-3" />
                         <span className="font-medium">{activeFile.name}</span>
                       </>
                     )}
                   </div>
                   <div className="flex items-center gap-3 opacity-60">
                     <span className="hover:text-blue-400 cursor-pointer transition-colors">
                       Ln {1}, Col {1}
                     </span>
                     <span className="hover:text-blue-400 cursor-pointer transition-colors">
                       UTF-8
                     </span>
                     <span className="hover:text-blue-400 cursor-pointer transition-colors">
                       JavaScript
                     </span>
                   </div>
                 </div>
       
                 {/* Content Area */}
                 <div className="flex-1 flex overflow-hidden relative min-h-0">
                   {activeFile ? (
                     <>
                       <div className="flex-1 relative h-full">
                         <EditorArea
                           key={activeFile.id}
                           theme={theme}
                           darkMode={darkMode}
                           code={activeFile.content}
                           onChange={handleCodeChange}
                           onCursorChange={handleLocalCursor}
                         />
                         {/* Remote Cursors Overlay */}
                         {onlineUsers.map((c) => {
                           if (c.fileId !== activeFileId || !c.cursor) return null;
                           // Simplified calc for cursor position demo
                           return (
                             <div
                               key={c.id}
                               className="absolute w-0.5 h-5 bg-yellow-500 z-50 pointer-events-none transition-all duration-75"
                               style={{
                                 top: c.cursor.line * 24 + "px",
                                 left: c.cursor.col * 9 + "px",
                               }}
                             >
                               <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-yellow-500 text-black text-[10px] font-bold">
                                 {c.name}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                       {/* Modern Minimap */}
                       <Minimap theme={theme} code={activeFile.content} />
                     </>
                   ) : (
                     <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none">
                       <div className="w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-700/10 rounded-full flex items-center justify-center mb-6">
                         <Code2 className="w-16 h-16 text-emerald-500/50" />
                       </div>
                       <h2 className="text-xl font-bold mb-2">No file is open</h2>
                       <p className="text-sm">
                         Select a file from the sidebar to start coding
                       </p>
                       <div className="mt-8 flex gap-4 text-xs">
                         <div className="flex flex-col items-center gap-2">
                           <span className="bg-white/10 px-2 py-1 rounded">⌘ P</span>
                           <span>Search Files</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                           <span className="bg-white/10 px-2 py-1 rounded">
                             ⌘ Shift F
                           </span>
                           <span>Find in Project</span>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
       
                 {/* Terminal Panel (Collapsible) */}
                 {showTerminal && (
                   <div
                     className={`h-64 border-t ${theme.border} ${theme.terminalBg} flex flex-col font-mono text-xs flex-shrink-0 animate-in slide-in-from-bottom duration-200`}
                   >
                     <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                       <div className="flex space-x-4">
                         <span className="font-bold border-b-2 border-blue-500 pb-2 -mb-2.5 text-emerald-400">
                           TERMINAL
                         </span>
                         <span className="opacity-50 hover:opacity-100 cursor-pointer">
                           OUTPUT
                         </span>
                         <span className="opacity-50 hover:opacity-100 cursor-pointer">
                           DEBUG CONSOLE
                         </span>
                       </div>
                       <div className="flex items-center gap-2">
                         <button
                           onClick={() => setTerminalOutput([])}
                           className="p-1 hover:bg-white/10 rounded"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                         <button
                           onClick={() => setShowTerminal(false)}
                           className="p-1 hover:bg-white/10 rounded"
                         >
                           <X className="w-3.5 h-3.5" />
                         </button>
                       </div>
                     </div>
                     <div className="flex-1 p-4 overflow-y-auto space-y-1 font-mono">
                       {terminalOutput.map((log, i) => (
                         <div
                           key={i}
                           className={`${
                             log.type === "error"
                               ? "text-red-400"
                               : log.type === "success"
                               ? "text-green-400"
                               : "text-zinc-400"
                           } flex gap-2`}
                         >
                           <span className="opacity-30 select-none">
                             {new Date().toLocaleTimeString()}
                           </span>
                           <span>{log.content}</span>
                         </div>
                       ))}
                       {isRunning && (
                         <div className="text-emerald-400 animate-pulse">
                           _ Executing script...
                         </div>
                       )}
                     </div>
                   </div>
                 )}
       
                 {/* Status Bar */}
                 <div
                   className={`h-6 bg-blue-600 text-white flex items-center px-3 justify-between text-[10px] font-medium select-none flex-shrink-0`}
                 >
                   <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-1 rounded">
                       <GitBranch className="w-3 h-3" />
                       <span>main*</span>
                     </div>
                     <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-1 rounded">
                       <AlertCircle className="w-3 h-3" />
                       <span>0 Errors</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <div
                       onClick={() => setShowTerminal(!showTerminal)}
                       className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-1 rounded"
                     >
                       <TerminalIcon className="w-3 h-3" />
                       <span>Terminal</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <div className="w-2 h-2 rounded-full bg-green-400"></div>
                       <span>SyncCode Live</span>
                     </div>
                   </div>
                 </div>
               </div>
      </div>
    </div>
  );
}

// ... (Sub-Components remain exactly as provided in previous snippets: FileTree, EditorArea, Minimap, ActivityIcon, Tab, getFileIcon, etc.)
// function FileTree({
//   items,
//   level = 0,
//   activeId,
//   selectedId,
//   editingId,
//   collaborators = [],
//   onToggle,
//   onSelect,
//   onRename,
//   onDelete,
//   setEditingId,
//   theme,
// }) {
//   return items.map((item) => {
//     const activeUsersHere = collaborators.filter((c) => c.fileId === item.id);
//     return (
//       <div key={item.id}>
//         <div
//           className={`flex items-center py-1 px-2 cursor-pointer transition-colors text-xs select-none border-l-2 group ${
//             item.id === selectedId ? "bg-blue-500/20" : "hover:bg-gray-500/10"
//           } ${
//             item.id === activeId
//               ? "text-blue-400 border-blue-400"
//               : "border-transparent"
//           }`}
//           style={{ paddingLeft: `${level * 12 + 12}px` }}
//           onClick={() => {
//             if (item.type === "folder") {
//               onToggle(item.id);
//               onSelect(item.id, "folder");
//             } else {
//               onSelect(item.id, "file");
//             }
//           }}
//         >
//           <span className="mr-1.5 opacity-70">
//             {item.type === "folder" ? (
//               item.isOpen ? (
//                 <ChevronDown className="w-3.5 h-3.5" />
//               ) : (
//                 <ChevronRight className="w-3.5 h-3.5" />
//               )
//             ) : (
//               getFileIcon(item.name)
//             )}
//           </span>
//           {editingId === item.id ? (
//             <input
//               autoFocus
//               className={`${theme.inputBg} ${theme.inputText} border border-blue-500 rounded px-1 outline-none w-full h-5`}
//               defaultValue={item.name}
//               onClick={(e) => e.stopPropagation()}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") onRename(item.id, e.currentTarget.value);
//                 if (e.key === "Escape") setEditingId(null);
//               }}
//               onBlur={(e) => onRename(item.id, e.currentTarget.value)}
//             />
//           ) : (
//             <div className="flex-1 flex justify-between items-center overflow-hidden">
//               <span className="truncate flex items-center">
//                 {item.name || "Untitled"}{" "}
//                 {activeUsersHere.length > 0 && (
//                   <div className="flex -space-x-1 ml-2">
//                     {activeUsersHere.map((u) => (
//                       <div
//                         key={u.id}
//                         className="w-2 h-2 rounded-full border border-black"
//                         style={{ backgroundColor: u.color }}
//                       />
//                     ))}
//                   </div>
//                 )}
//               </span>
//               <div className="hidden group-hover:flex items-center space-x-1 mr-1">
//                 <button
//                   className="hover:text-blue-400 p-0.5"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     setEditingId(item.id);
//                   }}
//                 >
//                   <Edit2 className="w-3 h-3" />
//                 </button>
//                 <button
//                   className="hover:text-red-400 p-0.5"
//                   onClick={(e) => onDelete(e, item.id)}
//                 >
//                   <Trash2 className="w-3 h-3" />
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//         {item.type === "folder" && item.isOpen && item.children && (
//           <FileTree
//             items={item.children}
//             level={level + 1}
//             activeId={activeId}
//             selectedId={selectedId}
//             editingId={editingId}
//             collaborators={collaborators}
//             onToggle={onToggle}
//             onSelect={onSelect}
//             onRename={onRename}
//             onDelete={onDelete}
//             setEditingId={setEditingId}
//             theme={theme}
//           />
//         )}
//       </div>
//     );
//   });
// }
// function EditorArea({ theme, darkMode, code, onChange, onCursorChange }) {
//   const handleChange = React.useCallback(
//     (val) => {
//       onChange(val);
//     },
//     [onChange]
//   );
//   const handleUpdate = React.useCallback(
//     (viewUpdate) => {
//       if (viewUpdate.selectionSet) {
//         const pos = viewUpdate.state.selection.main.head;
//         const lineObj = viewUpdate.state.doc.lineAt(pos);
//         if (onCursorChange)
//           onCursorChange({ line: lineObj.number - 1, col: pos - lineObj.from });
//       }
//     },
//     [onCursorChange]
//   );
//   return (
//     <div className={`relative h-full overflow-hidden font-mono text-sm`}>
//       <CodeMirror
//         value={code}
//         height="100%"
//         theme={darkMode ? githubDarkTheme : "light"}
//         extensions={[javascript({ jsx: true }), python()]}
//         onChange={handleChange}
//         onUpdate={handleUpdate}
//         className="h-full"
//       />
//     </div>
//   );
// }
// function Minimap({ theme, code }) {
//   return (
//     <div
//       className={`w-16 border-l ${theme.border} ${theme.bg} opacity-50 hidden md:block select-none overflow-hidden relative`}
//     >
//       <div className="text-[2px] leading-[3px] p-1 text-gray-500 font-mono whitespace-pre text-left break-all">
//         {code}
//       </div>
//     </div>
//   );
// }
// function ActivityIcon({ icon: Icon, active, notification, onClick }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`p-3 relative group transition-colors mb-2 ${
//         active ? "text-white" : "text-gray-500 hover:text-gray-300"
//       }`}
//     >
//       <Icon className="w-6 h-6" strokeWidth={1.5} />
//       {active && (
//         <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
//       )}
//       {notification > 0 && (
//         <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full text-[10px] flex items-center justify-center text-white border border-[#0d1117]">
//           {notification}
//         </div>
//       )}
//     </button>
//   );
// }
// function Tab({ name, active, theme, icon: Icon, color, onClick, onClose }) {
//   return (
//     <div
//       onClick={onClick}
//       className={`flex items-center px-3 h-full min-w-[120px] max-w-[180px] border-r ${
//         theme.border
//       } text-xs cursor-pointer group select-none relative ${
//         active
//           ? `${theme.tabActiveBg} ${theme.textActive} border-t-2 border-t-blue-500`
//           : `${theme.tabInactiveBg} opacity-70 hover:opacity-100 hover:bg-gray-800/50`
//       }`}
//     >
//       {Icon && <Icon className={`w-3.5 h-3.5 mr-2 ${color}`} />}
//       <span className="truncate flex-1 mr-2">{name}</span>
//       <button
//         onClick={onClose}
//         className={`opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-gray-500/20 transition-all ${
//           active ? "text-white" : ""
//         }`}
//       >
//         <X className="w-3 h-3" />
//       </button>
//     </div>
//   );
// }
const getFileIcon = (name) => {
  if (name.endsWith(".jsx") || name.endsWith(".js"))
    return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
  if (name.endsWith(".css"))
    return <Hash className="w-3.5 h-3.5 text-blue-400" />;
  if (name.endsWith(".json"))
    return <FileJson className="w-3.5 h-3.5 text-orange-400" />;
  return <File className="w-3.5 h-3.5 text-gray-400" />;
};
const getFileIconIcon = (name) => {
  if (name.endsWith(".jsx") || name.endsWith(".js")) return FileCode;
  if (name.endsWith(".css")) return Hash;
  if (name.endsWith(".json")) return FileJson;
  return File;
};
const getFileIconColor = (name) => {
  if (name.endsWith(".jsx") || name.endsWith(".js")) return "text-yellow-400";
  if (name.endsWith(".css")) return "text-blue-400";
  if (name.endsWith(".json")) return "text-orange-400";
  return "text-gray-400";
};


function ActivityIcon({ icon: Icon, active, notification, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 relative group transition-all duration-200 rounded-xl mx-2 ${
        active
          ? "bg-blue-500/20 text-blue-400"
          : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
      }`}
    >
      <Icon className="w-6 h-6" strokeWidth={1.5} />
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full -ml-4" />
      )}
      {notification > 0 && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-zinc-900 font-bold">
          {notification}
        </div>
      )}
    </button>
  );
}

function Tab({ name, active, theme, onClick, onClose }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 h-full min-w-[140px] max-w-[200px] border-r border-transparent text-xs cursor-pointer select-none relative group transition-colors ${
        active
          ? `${theme.tabActiveBg} ${theme.textActive} border-t-2 border-t-blue-500`
          : `${theme.tabInactiveBg} opacity-60 hover:opacity-100 hover:bg-white/5`
      }`}
    >
      <FileIcon name={name} className="mr-2.5 w-4 h-4" />
      <span className="truncate flex-1 font-medium">{name}</span>
      <button
        onClick={onClose}
        className={`opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 transition-all ml-1 ${
          active ? "text-white" : ""
        }`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// --- IMPROVED FILE TREE & ICONS ---

function FileTree({
  items,
  level = 0,
  activeId,
  selectedId,
  editingId,
  collaborators = [],
  onToggle,
  onSelect,
  onRename,
  onDelete,
  setEditingId,
  theme,
}) {
  return items.map((item) => {
    const activeUsersHere = collaborators.filter((c) => c.fileId === item.id);
    return (
      <div key={item.id}>
        <div
          className={`flex items-center py-1.5 px-2 cursor-pointer transition-all duration-150 text-sm select-none rounded-lg mx-1 ${
            item.id === selectedId || item.id === activeId
              ? "bg-blue-500/20 text-white"
              : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (item.type === "folder") {
              onToggle(item.id);
              onSelect(item.id, "folder");
            } else {
              onSelect(item.id, "file");
            }
          }}
        >
          <span className="mr-2 opacity-100 flex-shrink-0">
            {item.type === "folder" ? (
              item.isOpen ? (
                <FolderOpen className="w-4 h-4 text-blue-400 fill-blue-400/20" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
              )
            ) : (
              <FileIcon name={item.name} className="w-4 h-4" />
            )}
          </span>

          {editingId === item.id ? (
            <input
              autoFocus
              className="bg-zinc-800 text-white border border-blue-500 rounded px-2 py-0.5 outline-none w-full text-sm"
              defaultValue={item.name}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRename(item.id, e.currentTarget.value);
                if (e.key === "Escape") setEditingId(null);
              }}
              onBlur={(e) => onRename(item.id, e.currentTarget.value)}
            />
          ) : (
            <div className="flex-1 flex justify-between items-center overflow-hidden group">
              <span className="truncate">{item.name || "Untitled"}</span>

              <div className="flex items-center">
                {/* User dots */}
                {activeUsersHere.length > 0 && (
                  <div className="flex -space-x-1 mr-2">
                    {activeUsersHere.map((u) => (
                      <div
                        key={u.id}
                        className="w-2 h-2 rounded-full border border-black"
                        style={{ backgroundColor: u.color }}
                      />
                    ))}
                  </div>
                )}

                {/* Action Buttons (Hidden until hover) */}
                <div className="hidden group-hover:flex items-center gap-1 mr-1">
                  <button
                    className="hover:bg-blue-500/20 p-1 rounded text-blue-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(item.id);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    className="hover:bg-red-500/20 p-1 rounded text-red-400"
                    onClick={(e) => onDelete(e, item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {item.type === "folder" && item.isOpen && item.children && (
          <FileTree
            items={item.children}
            level={level + 1}
            activeId={activeId}
            selectedId={selectedId}
            editingId={editingId}
            collaborators={collaborators}
            onToggle={onToggle}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
            setEditingId={setEditingId}
            theme={theme}
          />
        )}
      </div>
    );
  });
}

// --- MATERIAL ICON SIMULATION ---
// Simulates VS Code Material Icon Theme using Lucide with Colors
const FileIcon = ({ name, className }) => {
  const ext = name.split(".").pop().toLowerCase();

  // Icon Mapping Logic
  if (ext === "jsx" || ext === "tsx" || ext === "react")
    return <FileCode className={`${className} text-[#61DAFB]`} />; // React Blue
  if (ext === "js")
    return <FileJson className={`${className} text-[#F7DF1E]`} />; // JS Yellow
  if (ext === "ts")
    return <FileCode className={`${className} text-[#3178C6]`} />; // TS Blue
  if (ext === "html")
    return <FileCode className={`${className} text-[#E34F26]`} />; // HTML Orange
  if (ext === "css") return <Hash className={`${className} text-[#1572B6]`} />; // CSS Blue
  if (ext === "json")
    return <FileJson className={`${className} text-[#CBCB41]`} />; // JSON Yellow
  if (ext === "py")
    return <FileCode className={`${className} text-[#3776AB]`} />; // Python Blue
  if (["png", "jpg", "jpeg", "svg"].includes(ext))
    return <ImageIcon className={`${className} text-purple-400`} />;
  if (ext === "md") return <FileText className={`${className} text-white`} />;

  return <File className={`${className} text-gray-400`} />;
};

function EditorArea({ theme, darkMode, code, onChange, onCursorChange }) {
  // Wrapper to debounce or format if needed
 const handleChange = React.useCallback(
    (val) => {
      onChange(val);
    },
    [onChange]
  );
  const handleUpdate = React.useCallback(
    (viewUpdate) => {
      if (viewUpdate.selectionSet) {
        const pos = viewUpdate.state.selection.main.head;
        const lineObj = viewUpdate.state.doc.lineAt(pos);
        if (onCursorChange)
          onCursorChange({ line: lineObj.number - 1, col: pos - lineObj.from });
      }
    },
    [onCursorChange]
  );
  return (
    <div className="relative h-full overflow-hidden text-base">
      {" "}
      {/* Larger Text */}
      <CodeMirror
        value={code}
        height="100%"
        theme={darkMode ? githubDarkTheme : "light"}
        extensions={[javascript({ jsx: true }), python()]}
       onChange={handleChange}
        onUpdate={handleUpdate}
        className="h-full font-mono text-[14px]"
      />
    </div>
  );
}

function Minimap({ theme, code }) {
  return (
    <div
      className={`w-20 border-l ${theme.border} ${theme.bg} hidden md:block select-none overflow-hidden relative opacity-70`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
      <div className="text-[3px] leading-[4px] p-2 text-zinc-500 font-mono whitespace-pre text-left opacity-60">
        {code}
      </div>
    </div>
  );
}

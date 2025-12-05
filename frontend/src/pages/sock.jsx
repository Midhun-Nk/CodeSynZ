import React, { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { 
  Search, Settings, MoreVertical, Code2, GitBranch, Zap, FileCode, File,
  FileJson, ChevronRight, ChevronDown, X, FolderPlus, FilePlus, Menu,
  Sun, Moon, Hash, Terminal as TerminalIcon, Layout, Bell, AlertCircle,
  AlertTriangle, Edit2, Trash2, Users, UserPlus, Check, Ban, MousePointer2,
  Share2, Play, Loader2, LogOut, Package ,Shield, UserMinus, MoreHorizontal, CheckCircle2
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import { io } from 'socket.io-client'; 
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CodeContext } from '../context/CodeContext';

// --- CONFIG ---
const API_URL = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';

// --- HELPER: API FETCH ---
// const api = axios.create({
//   baseURL: API_URL,
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// const apiCall = async (endpoint, method = "GET", body = null) => {
//   try {
//     const res = await api({
//       url: endpoint,
//       method,
//       data: body,
//     });
//     return res.data; 
//   } catch (err) {
//     console.log("AXIOS ERROR RESPONSE:", err.response?.data);
//     throw new Error(
//       err.response?.data?.message ||
//       err.response?.data?.error ||
//       err.message ||
//       "API error"
//     );
//   }
// };

// --- THEME DEFINITION ---
const githubDarkTheme = EditorView.theme({
  "&": { color: "#c9d1d9", backgroundColor: "#0d1117" },
  ".cm-content": { caretColor: "#c9d1d9" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "#c9d1d9" },
  "&.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "#163356" },
  ".cm-gutters": { backgroundColor: "#0d1117", color: "#8b949e", borderRight: "1px solid #30363d" },
  ".cm-activeLineGutter": { backgroundColor: "#163356" }
}, { dark: true });

export default function CodeEditor() {

  const {
    apiCall,handleSendInvite
  } = useContext(CodeContext)
  const { projectId } = useParams(); 
  const navigate = useNavigate();
  const PROJECT_ID = projectId; 

  const [darkMode, setDarkMode] = useState(true);
  
  // -- Identity State --
  const [currentUser, setCurrentUser] = useState({
    name: "Loading...", 
    color: '#888'
  });
  const [currentUserId, setCurrentUserId] = useState(null); 

  // -- File System State --
  const [files, setFiles] = useState([]); 
  const [loading, setLoading] = useState(true);

  // -- Navigation State --
  const [activeFileId, setActiveFileId] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarView, setSidebarView] = useState('explorer'); 
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
    { type: 'info', content: 'SyncCode Terminal v1.0.0' },
    { type: 'info', content: 'Connecting to server...' }
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // -- Collaboration State --
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [projectMembers, setProjectMembers] = useState([]); 
  const [pendingInvites, setPendingInvites] = useState([]); 
  const [accessRequests, setAccessRequests] = useState([]); 
  
  // -- Invite Modal State --
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer'); 
  const [isInviting, setIsInviting] = useState(false);

  const socketRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isRemoteUpdate = useRef(false); // Prevents echo loop
  const lastCursorEmit = useRef(0); // For throttling cursor updates

  // Theme configuration
  const theme = {
    bg: darkMode ? 'bg-[#0d1117]' : 'bg-gray-50', 
    sidebarBg: darkMode ? 'bg-[#010409]' : 'bg-white',
    activityBarBg: darkMode ? 'bg-[#0d1117]' : 'bg-gray-100',
    text: darkMode ? 'text-gray-300' : 'text-gray-700',
    textActive: darkMode ? 'text-white' : 'text-black',
    border: darkMode ? 'border-[#30363d]' : 'border-gray-200',
    tabActiveBg: darkMode ? 'bg-[#0d1117]' : 'bg-white',
    tabInactiveBg: darkMode ? 'bg-[#010409]' : 'bg-gray-100',
    inputBg: darkMode ? 'bg-zinc-800' : 'bg-white',
    inputText: darkMode ? 'text-white' : 'text-black',
    terminalBg: darkMode ? 'bg-[#0d1117]' : 'bg-white',
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  // --------------------------------------------------------------------------
  // IDENTITY SETUP (Extract ID from Token)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.id || payload._id);
            setCurrentUser(prev => ({ ...prev, name: payload.username || "User" }));
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
  // MANAGEMENT ACTIONS (Roles, Removal, Requests)
  // --------------------------------------------------------------------------

  // 1. Change Role (OWNER ONLY)
  const handleRoleChange = async (userId, newRole) => {
    try {
        await apiCall(`/projects/${PROJECT_ID}/collaborators/${userId}`, 'PATCH', { role: newRole });
        setProjectMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    } catch (error) {
        alert("Error changing role: " + error.message);
    }
  };

  // 2. Remove Member (OWNER Kicking someone)
  const handleRemoveMember = async (userId) => {
    if(!window.confirm("Remove this user from the project?")) return;
    try {
        await apiCall(`/projects/${PROJECT_ID}/collaborators/${userId}`, 'DELETE');
        setProjectMembers(prev => prev.filter(m => m.id !== userId));
        setOnlineUsers(prev => prev.filter(u => u.id !== userId));
        alert("User removed successfully.");
    } catch (error) {
        alert("Failed to remove user: " + error.message);
    }
  };

  // 3. Leave Project (SELF Removal)
  const handleLeaveProject = async () => {
    if(!window.confirm("Are you sure you want to leave this project? You will lose access.")) return;
    try {
        await apiCall(`/projects/${PROJECT_ID}/collaborators/${currentUserId}`, 'DELETE');
        alert("You have left the project.");
        navigate('/'); 
    } catch (error) {
        alert("Failed to leave project: " + error.message);
    }
  };

  // 4. Handle Access Requests (Approve/Reject)
  const handleAccessRequestAction = async (user, action) => {
      if (!user || !user._id) return;
      try {
        await apiCall(`/projects/${PROJECT_ID}/access-requests/review`, 'POST', { 
            userId: user._id, 
            status: action === 'approve' ? 'approved' : 'rejected' 
        });

        // Optimistic UI Update
        setAccessRequests(prev => prev.filter(r => r.user?._id !== user._id));

        if (action === 'approve') {
             setProjectMembers(prev => [...prev, {
                 id: user._id,
                 name: user.username,
                 email: user.email,
                 role: 'viewer', // Default
                 color: '#888888'
             }]);
             alert(`Request approved. ${user.username} added to team.`);
        }
      } catch (error) {
          alert(error.message);
      }
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

        const membersList = [{ id: project.owner._id, name: project.owner.username, email: project.owner.email, role: 'owner', color: project.owner.avatarColor }];
        if(project.collaborators) {
            project.collaborators.forEach(c => {
                membersList.push({ id: c.id, name: c.name, email: c.email, role: c.role, color: c.color });
            });
        }
        setProjectMembers(membersList);

        if(project.invitations) setPendingInvites(project.invitations.map((inv, idx) => ({ id: inv._id || idx, email: inv.email, role: inv.role })));
        if(project.accessRequests) setAccessRequests(project.accessRequests);

      } catch (err) {
        if (err.message.toLowerCase().includes('access denied')) { setIsAuthorized(false); setLoading(false); return; }
        console.error("Load error", err);
        setLoading(false);
      }
    };
  
    if(currentUserId) init();

    // SOCKET SETUP
    const token = localStorage.getItem("token");
    socketRef.current = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    const socket = socketRef.current;

    socket.on('connect', () => {
       socket.emit('join-room', { roomId: PROJECT_ID, userName: currentUser.name, color: currentUser.color });
    });

    // GLITCH FIX: Handle Code Updates safely
    socket.on('code-update', ({ fileId, code }) => {
      // 1. Mark this as a remote update so onChange doesn't echo it back
      if (fileId === activeFileId) {
          isRemoteUpdate.current = true; 
      }
      
      setFiles(prev => {
        const updateRecursive = (list) => list.map(item => {
          if (item.id === fileId) return { ...item, content: code };
          if (item.children) return { ...item, children: updateRecursive(item.children) };
          return item;
        });
        return updateRecursive(prev);
      });
    });

    socket.on('cursor-update', ({ id, cursor, fileId }) => {
      if (id === socket.id) return; // Don't track own cursor from server
      setOnlineUsers(prev => {
          const exists = prev.find(u => u.id === id);
          if (exists) return prev.map(u => u.id === id ? { ...u, cursor, fileId } : u);
          return prev; // Wait for join event to add user
      });
    });

    socket.on('user-joined', (user) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
      setTerminalOutput(prev => [...prev, { type: 'info', content: `> ${user.name} joined.` }]);
    });

    socket.on('sync-users', (users) => {
        // Filter out self from online users to avoid drawing own cursor
        setOnlineUsers(users.filter(u => u.id !== socket.id));
    });

    socket.on('user-left', (socketId) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== socketId));
    });

    return () => { socket.disconnect(); };
  }, [currentUser, PROJECT_ID, currentUserId, activeFileId]); 


  // --- HANDLERS ---
  
  // GLITCH FIX: Throttle Cursor & Prevent Echo Loop
  const handleCodeChange = useCallback((newContent) => {
    // 1. If this change came from the server (remote), ignore emitting
    if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
    }

    // 2. Update Local State
    const updateContentRecursive = (list) => list.map(item => {
      if (item.id === activeFileId) return { ...item, content: newContent };
      if (item.children) return { ...item, children: updateContentRecursive(item.children) };
      return item;
    });
    setFiles(prev => updateContentRecursive(prev));

    // 3. Emit to Server
    if(socketRef.current) socketRef.current.emit('code-change', { roomId: PROJECT_ID, fileId: activeFileId, code: newContent });

    // 4. Debounce DB Save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try { await apiCall(`/projects/${PROJECT_ID}/files/${activeFileId}/content`, 'PUT', { content: newContent }); } catch (err) {}
    }, 2000); // Increased debounce to 2s to reduce DB load
  }, [activeFileId, PROJECT_ID]);

  // GLITCH FIX: Throttle Cursor
  const handleLocalCursor = useCallback((cursorPos) => { 
    const now = Date.now();
    // Only emit cursor every 50ms
    if (now - lastCursorEmit.current > 50) {
        if(socketRef.current) socketRef.current.emit('cursor-move', { roomId: PROJECT_ID, fileId: activeFileId, cursor: cursorPos });
        lastCursorEmit.current = now;
    }
  }, [activeFileId, PROJECT_ID]);

  // --- UTILS ---
  const handleFileSelect = (id, type) => { 
      setSelectedId(id); 
      if (type === 'file') { 
          if (!openFiles.includes(id)) setOpenFiles([...openFiles, id]); 
          setActiveFileId(id); 
      } 
  };
  // --------------------------------------------------------------------------
  // HANDLERS (Files, Execution, Collab)
  // --------------------------------------------------------------------------
  const runCode = async () => {
    if (!activeFile) return;
    setIsRunning(true);
    setShowTerminal(true);
    setTerminalOutput(prev => [...prev, { type: 'info', content: `> Run File: ${activeFile.name}...` }]);

    const langMap = { 'js': 'nodejs', 'jsx': 'nodejs', 'py': 'python3', 'java': 'java', 'cpp': 'cpp17', 'c': 'c', 'go': 'go' };
    const ext = activeFile.name.split('.').pop();
    const language = langMap[ext];

    if (!language) {
      setTerminalOutput(prev => [...prev, { type: 'error', content: `Error: Extension .${ext} not supported.` }]);
      setIsRunning(false); return;
    }

    try {
      const data = await apiCall('/compiler/run', 'POST', { script: activeFile.content, language: language, versionIndex: "0" });
      if (data.output) setTerminalOutput(prev => [...prev, { type: 'success', content: data.output }]);
      else setTerminalOutput(prev => [...prev, { type: 'info', content: 'Execution finished.' }]);
    } catch (error) {
       setTerminalOutput(prev => [...prev, { type: 'error', content: `Error: ${error.message}` }]);
    }
    setIsRunning(false);
  };

  const runProject = async () => {
    setIsRunning(true);
    setShowTerminal(true);
    setTerminalOutput(prev => [...prev, { type: 'info', content: `> Compiling Project...` }]);
    const allFiles = getAllFiles(files); 
    try {
      const data = await apiCall('/compiler/run-project', 'POST', { files: allFiles, entryFile: activeFile ? activeFile.name : Object.keys(allFiles)[0] });
      if (data.output) setTerminalOutput(prev => [...prev, { type: 'success', content: data.output }]);
      else if (data.error) setTerminalOutput(prev => [...prev, { type: 'error', content: `Error: ${data.error}` }]);
      else setTerminalOutput(prev => [...prev, { type: 'info', content: 'Project finished.' }]);
    } catch (error) {
       setTerminalOutput(prev => [...prev, { type: 'error', content: `Failed: ${error.message}` }]);
    }
    setIsRunning(false);
  };
  
  // const handleSendInvite = async () => {
  //   if (!inviteEmail) { alert("Please enter an email address"); return; }
  //   setIsInviting(true);
  //   try {
  //       await apiCall(`/projects/${PROJECT_ID}/invite`, 'POST', { email: inviteEmail, role: inviteRole });
  //       setPendingInvites(prev => [...prev, { id: Date.now(), email: inviteEmail, role: inviteRole }]);
  //       setInviteEmail('');
  //       setShowInviteModal(false);
  //       alert(`Invite sent successfully.`);
  //   } catch (error) {
  //       alert(error.message);
  //   } finally {
  //       setIsInviting(false);
  //   }
  // };

  const handleRequestAccess = async () => {
    setIsRequestingAccess(true);
    try {
      await apiCall(`/projects/${PROJECT_ID}/request-access`, 'POST');
      setAccessRequestSent(true);
      alert("Request sent successfully.");
    } catch (err) {
      if(err.message.includes("already pending")) {
          setAccessRequestSent(true);
          alert("Request is already pending.");
      } else {
          alert("Failed to send request: " + err.message);
      }
    } finally {
      setIsRequestingAccess(false);
    }
  };

  // Helper for Recursion
  const getAllFiles = (list, path = "") => {
    let map = {};
    list.forEach(item => {
      if (item.type === 'file') { map[path + item.name] = item.content || ""; } 
      else if (item.children) { Object.assign(map, getAllFiles(item.children, path + item.name + "/")); }
    });
    return map;
  };


  

 
  const handleTabClick = (id) => { setActiveFileId(id); setSelectedId(id); };
  const handleCloseTab = (e, id) => { e.stopPropagation(); const newOpenFiles = openFiles.filter(fileId => fileId !== id); setOpenFiles(newOpenFiles); if (activeFileId === id) { if (newOpenFiles.length > 0) { const nextId = newOpenFiles[newOpenFiles.length - 1]; setActiveFileId(nextId); setSelectedId(nextId); } else { setActiveFileId(null); setSelectedId(null); } } };
  const handleToggleFolder = (id) => { const toggleRecursive = (list) => list.map(item => { if (item.id === id) return { ...item, isOpen: !item.isOpen }; if (item.children) return { ...item, children: toggleRecursive(item.children) }; return item; }); setFiles(prev => toggleRecursive(prev)); };
  
  const handleCreateItem = (type) => {
    const tempId = "temp_" + Date.now(); setCreatingType(type); 
    const newItem = { id: tempId, name: '', type: type, content: '', children: type === 'folder' ? [] : undefined, isOpen: true, isTemp: true };
    let inserted = false;
    const addItemRecursive = (list) => list.map(item => { if (item.id === selectedId && item.type === 'folder') { inserted = true; return { ...item, isOpen: true, children: [newItem, ...(item.children || [])] }; } if (item.children) return { ...item, children: addItemRecursive(item.children) }; return item; });
    let newFiles = addItemRecursive(files); if (!inserted) newFiles = [...newFiles, newItem];
    setFiles(newFiles); setEditingId(tempId);
  };

  const handleRename = async (id, newName) => {
    if (!newName.trim()) { if(id.startsWith('temp_')) { setFiles(prev => prev.filter(f => f.id !== id)); setEditingId(null); } return; }
    const isCreating = id.startsWith('temp_');
    try {
        if (isCreating) {
            const findParentId = (list, childId, parentId = null) => { for (const item of list) { if (item.id === childId) return parentId; if (item.children) { const found = findParentId(item.children, childId, item.id); if (found) return found; } } return null; };
            const parentId = findParentId(files, id);
            const data = await apiCall(`/projects/${PROJECT_ID}/files`, 'POST', { parentId: parentId, name: newName, type: creatingType });
            const replaceRecursive = (list) => list.map(item => { if (item.id === id) return { ...item, id: data.id, name: data.name, isTemp: false }; if (item.children) return { ...item, children: replaceRecursive(item.children) }; return item; });
            setFiles(prev => replaceRecursive(prev)); setCreatingType(null); if(creatingType === 'file') handleFileSelect(data.id, 'file');
        } else {
            await apiCall(`/projects/${PROJECT_ID}/files/${id}/rename`, 'PUT', { name: newName });
            const renameRecursive = (list) => list.map(item => { if (item.id === id) return { ...item, name: newName }; if (item.children) return { ...item, children: renameRecursive(item.children) }; return item; });
            setFiles(prev => renameRecursive(prev));
        }
    } catch (err) { alert(err.message); } setEditingId(null);
  };

  const handleDelete = async (e, id) => { e.stopPropagation(); if (!window.confirm("Delete this item?")) return; try { await apiCall(`/projects/${PROJECT_ID}/files/${id}`, 'DELETE'); const deleteRecursive = (list) => list.filter(item => { if (item.id === id) return false; if (item.children) item.children = deleteRecursive(item.children); return true; }); setFiles(prev => deleteRecursive(prev)); if (activeFileId === id) handleCloseTab(e, id); if (openFiles.includes(id)) setOpenFiles(prev => prev.filter(fid => fid !== id)); } catch (err) { alert("Failed to delete: " + err.message); } };

  const activeFile = findFileById(files, activeFileId);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  if (loading) return <div className={`h-screen flex items-center justify-center ${theme.bg} ${theme.text}`}><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  if (!isAuthorized) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center ${theme.bg} ${theme.text} animate-fade-in`}>
        <div className={`max-w-md w-full p-8 rounded-2xl border ${theme.border} ${theme.sidebarBg} shadow-2xl text-center`}>
          <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6"><Shield className="w-10 h-10 text-red-500" /></div>
          <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
          <p className="opacity-60 mb-8 text-sm">You do not have permission to view this project.</p>
          {accessRequestSent ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center"><CheckCircle2 className="w-8 h-8 text-green-500 mb-2" /><span className="font-bold text-green-500">Request Sent!</span></div>
          ) : (
            <div className="space-y-3">
                <button onClick={handleRequestAccess} disabled={isRequestingAccess} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg">{isRequestingAccess ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />} Request Permission</button>
                <button onClick={() => window.history.back()} className="w-full py-3 rounded-xl hover:bg-gray-500/10 transition-colors text-xs font-medium opacity-60 hover:opacity-100">Go Back to Dashboard</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${theme.bg} ${theme.text} overflow-hidden font-sans text-sm relative`}>
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className={`${theme.sidebarBg} border ${theme.border} p-6 rounded-xl shadow-2xl w-96 animate-fade-in`}>
            <div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold ${theme.textActive}`}>Invite Collaborator</h3><button onClick={() => setShowInviteModal(false)}><X className="w-5 h-5 opacity-50 hover:opacity-100" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium opacity-70 mb-1">Email Address</label><div className={`flex items-center px-3 py-2 rounded-md border ${theme.border} ${theme.inputBg}`}><input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" className={`flex-1 bg-transparent outline-none ${theme.inputText}`} /></div></div>
              <div><label className="block text-xs font-medium opacity-70 mb-1">Permission</label><div className={`relative px-3 py-2 rounded-md border ${theme.border} ${theme.inputBg}`}><select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className={`w-full bg-transparent outline-none appearance-none ${theme.inputText}`}><option value="viewer">Viewer</option><option value="editor">Editor</option></select><ChevronDown className="w-4 h-4 absolute right-3 top-2.5 opacity-50 pointer-events-none" /></div></div>
              <button onClick={()=>handleSendInvite(inviteEmail, inviteRole, PROJECT_ID, setPendingInvites, setInviteEmail, setShowInviteModal, setIsInviting)} disabled={isInviting} className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-md transition-colors flex items-center justify-center`}>{isInviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />} Send Invite</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={`h-10 border-b ${theme.border} ${theme.sidebarBg} flex items-center justify-between px-3 select-none`}>
        <div className="flex items-center space-x-3"><Menu className="w-4 h-4 opacity-70 cursor-pointer" /><span className="font-medium text-xs flex items-center opacity-80">File <span className="mx-2">Edit</span> <span className="mx-2">View</span></span></div>
        <div className="flex-1 flex justify-center items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-md border ${theme.border} ${theme.bg} opacity-80 w-64 max-w-lg`}><Search className="w-3 h-3 opacity-50" /><span className="text-xs opacity-50">SyncCode - {activeFile ? activeFile.name : 'No file'}</span></div>
            <button onClick={runCode} disabled={isRunning || !activeFile} className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${isRunning ? 'bg-gray-700' : 'bg-green-600 hover:bg-green-500 text-white'}`}>{isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}<span>Run File</span></button>
            <button onClick={runProject} disabled={isRunning} className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${isRunning ? 'bg-gray-700' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>{isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}<span>Run Project</span></button>
        </div>
        <div className="flex items-center space-x-3">
            <div className="flex -space-x-2 mr-2">
                {onlineUsers.map(c => (<div key={c.id} className="w-6 h-6 rounded-full border-2 border-[#0d1117] flex items-center justify-center text-[10px] font-bold text-white relative group cursor-pointer" style={{ backgroundColor: c.color }}>{c.name ? c.name[0].toUpperCase() : '?'}<span className="absolute top-7 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">{c.name}</span></div>))}
                <button onClick={() => setShowInviteModal(true)} className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white border-2 border-[#0d1117]"><UserPlus className="w-3 h-3" /></button>
            </div>
            <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-gray-500/10">{darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className={`w-12 border-r ${theme.border} ${theme.activityBarBg} flex flex-col items-center py-2 z-20`}>
          <ActivityIcon icon={FileCode} active={sidebarView === 'explorer'} onClick={() => setSidebarView('explorer')} />
          <ActivityIcon icon={Users} active={sidebarView === 'collab'} onClick={() => setSidebarView('collab')} notification={pendingInvites.length + accessRequests.length} />
          <div className="flex-1" />
          <ActivityIcon icon={Settings} />
        </div>

        {/* Sidebar Content */}
        <div className={`w-60 border-r ${theme.border} ${theme.sidebarBg} flex flex-col`}>
          {sidebarView === 'explorer' && (
            <>
              <div className="flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider opacity-70"><span>Explorer</span><MoreVertical className="w-4 h-4 cursor-pointer" /></div>
              <div className="px-2 pb-2 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between text-xs px-2 py-1 mb-2 font-bold opacity-80 group cursor-pointer hover:opacity-100"><span className="flex items-center"><ChevronDown className="w-3 h-3 mr-1"/> PROJECT</span><div className="flex space-x-1"><button onClick={() => handleCreateItem('file')} className="p-1 hover:bg-gray-500/10 rounded"><FilePlus className="w-3.5 h-3.5" /></button><button onClick={() => handleCreateItem('folder')} className="p-1 hover:bg-gray-500/10 rounded"><FolderPlus className="w-3.5 h-3.5" /></button></div></div>
                <FileTree items={files} activeId={activeFileId} selectedId={selectedId} editingId={editingId} collaborators={onlineUsers} onToggle={handleToggleFolder} onSelect={handleFileSelect} onRename={handleRename} onDelete={handleDelete} setEditingId={setEditingId} theme={theme} />
              </div>
            </>
          )}

          {/* --- COLLABORATION SIDEBAR (Fixed) --- */}
          {sidebarView === 'collab' && (
            <>
              <div className="flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider opacity-70"><span>Collaboration</span></div>
              <div className="p-2 space-y-6 overflow-y-auto">
                
                {/* 1. ACCESS REQUESTS (Only Visible if Owner) */}
                {amIOwner && accessRequests.length > 0 && (
                    <div>
                        <div className="text-[10px] font-bold opacity-50 mb-2 px-2 flex justify-between">
                            <span>ACCESS REQUESTS</span>
                            <span className="bg-red-500 text-white px-1.5 rounded-full">{accessRequests.length}</span>
                        </div>
                        {accessRequests.map((req) => (
                             <div key={req._id} className="flex items-center justify-between p-2 rounded hover:bg-gray-500/10 mb-1 border border-orange-500/30 bg-orange-500/5">
                                <div className="flex flex-col min-w-0">
                                    <span className="font-medium truncate">{req.user?.username || 'Unknown'}</span>
                                    <span className="text-[9px] opacity-60 truncate">{req.user?.email || req.email}</span>
                                </div>
                                <div className="flex space-x-1">
                                    <button onClick={() => handleAccessRequestAction(req.user || { email: req.email }, 'approve')} className="p-1 text-green-500 hover:bg-green-500/10 rounded" title="Approve"><Check className="w-3.5 h-3.5"/></button>
                                    <button onClick={() => handleAccessRequestAction(req.user || { email: req.email }, 'reject')} className="p-1 text-red-500 hover:bg-red-500/10 rounded" title="Reject"><X className="w-3.5 h-3.5"/></button>
                                </div>
                             </div>
                        ))}
                    </div>
                )}

                {/* 2. PENDING INVITES */}
                <div>
                   <div className="text-[10px] font-bold opacity-50 mb-2 px-2 flex justify-between"><span>PENDING INVITES</span><span className="bg-blue-600 text-white px-1.5 rounded-full">{pendingInvites.length}</span></div>
                   {pendingInvites.map(inv => (
                     <div key={inv.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-500/10 group mb-1">
                        <div className="flex flex-col min-w-0">
                           <span className="font-medium truncate">{inv.email}</span>
                           <span className="text-[9px] text-blue-400 capitalize">{inv.role}</span>
                        </div>
                        <span className="text-[9px] opacity-40 italic">Waiting</span>
                     </div>
                   ))}
                   {pendingInvites.length === 0 && <span className="px-2 text-xs opacity-30 italic">No pending invites</span>}
                </div>

                <div className="h-px bg-gray-500/20"></div>

                {/* 3. TEAM MEMBERS */}
                <div>
                  <div className="text-[10px] font-bold opacity-50 mb-2 px-2">TEAM MEMBERS</div>
                  {projectMembers.map(member => (
                    <div key={member.id} className="flex flex-col p-2 rounded hover:bg-gray-500/10 group mb-1">
                      <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center space-x-2 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                                {member.name ? member.name[0].toUpperCase() : 'U'}
                            </div>
                            <span className="truncate font-medium">{member.name || member.email}</span>
                         </div>
                         <div className={`w-2 h-2 rounded-full ${onlineUsers.find(u => u.name === member.name) ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} title={onlineUsers.find(u => u.name === member.name) ? 'Online' : 'Offline'}></div>
                      </div>

                      {/* ROLE MANAGEMENT & LEAVE/KICK LOGIC */}
                      <div className="flex items-center justify-between pl-7">
                          {member.role === 'owner' ? (
                              <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Shield className="w-3 h-3"/> Owner</span>
                          ) : (
                              <div className="flex items-center space-x-2 w-full">
                                  {/* Role Dropdown - ONLY VISIBLE TO OWNER */}
                                  {amIOwner ? (
                                      <div className="relative group/role">
                                          <select 
                                              value={member.role} 
                                              onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                              className={`appearance-none bg-transparent text-[10px] uppercase font-bold outline-none cursor-pointer ${member.role === 'editor' ? 'text-blue-400' : 'text-gray-400'} hover:text-white transition-colors`}
                                          >
                                              <option value="viewer" className="bg-gray-900 text-gray-400">Viewer</option>
                                              <option value="editor" className="bg-gray-900 text-blue-400">Editor</option>
                                          </select>
                                      </div>
                                  ) : (
                                      <span className={`text-[10px] uppercase font-bold ${member.role === 'editor' ? 'text-blue-400' : 'text-gray-400'}`}>{member.role}</span>
                                  )}

                                  <div className="flex-1"></div>

                                  {/* ACTIONS: KICK OR LEAVE */}
                                  {/* Case 1: Owner viewing others -> Show KICK */}
                                  {amIOwner && member.id !== currentUserId && (
                                      <button onClick={() => handleRemoveMember(member.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-opacity" title="Remove from project">
                                          <UserMinus className="w-3.5 h-3.5" />
                                      </button>
                                  )}

                                  {/* Case 2: Collaborator viewing THEMSELVES -> Show LEAVE */}
                                  {!amIOwner && member.id === currentUserId && (
                                      <button onClick={handleLeaveProject} className="p-1 text-red-400 hover:bg-red-500/10 rounded" title="Leave Project">
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
            </>
          )}

          {!['explorer', 'collab'].includes(sidebarView) && <div className="p-4 text-xs opacity-50 flex flex-col items-center justify-center h-full">Coming soon</div>}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-hidden">
          {/* Tabs */}
          <div className={`flex items-center ${theme.activityBarBg} border-b ${theme.border} overflow-x-auto scrollbar-hide h-9 flex-shrink-0`}>
            {openFiles.map(fileId => {
              const file = findFileById(files, fileId);
              if (!file) return null;
              return <Tab key={file.id} name={file.name} active={activeFileId === file.id} theme={theme} icon={getFileIconIcon(file.name)} color={getFileIconColor(file.name)} onClick={() => handleTabClick(file.id)} onClose={(e) => handleCloseTab(e, file.id)} />;
            })}
          </div>

          {/* Editor + Minimap */}
          <div className="flex-1 flex overflow-hidden relative min-h-0">
            {activeFile ? (
              <>
                <div className="flex-1 relative h-full">
                  <EditorArea key={activeFile.id} theme={theme} darkMode={darkMode} code={activeFile.content} onChange={handleCodeChange} onCursorChange={handleLocalCursor} />
                  {onlineUsers.map(c => {
                    if (c.fileId !== activeFileId) return null;
                    const top = 4 + (c.cursor?.line * 21 || 0); const left = 50 + (c.cursor?.col * 8.4 || 0);
                    return (<div key={c.id} className="absolute w-0.5 h-5 transition-all duration-100 pointer-events-none z-10" style={{ top: `${top}px`, left: `${left}px`, backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}` }}><div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap" style={{ backgroundColor: c.color }}>{c.name}</div></div>)
                  })}
                </div>
                <Minimap theme={theme} code={activeFile.content} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center opacity-30 flex-col"><Code2 className="w-16 h-16 mb-4" /><p>Select a file to start editing</p></div>
            )}
          </div>

          {/* Terminal & Status Bar */}
          {showTerminal && (
            <div className={`h-48 border-t ${theme.border} ${theme.terminalBg} flex flex-col font-mono text-xs flex-shrink-0`}>
              <div className="flex items-center justify-between px-3 py-1 border-b border-[#30363d] opacity-80"><span className="font-bold">TERMINAL</span><div className="flex space-x-2"><button onClick={() => setTerminalOutput([])}><Trash2 className="w-3 h-3 hover:text-white" /></button><button onClick={() => setShowTerminal(false)}><X className="w-3 h-3 hover:text-white" /></button></div></div>
              <div className="flex-1 p-3 overflow-y-auto space-y-1">{terminalOutput.map((log, i) => (<div key={i} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-400'}`}>{log.content}</div>))} {isRunning && <div className="text-yellow-400 animate-pulse">_ Executing...</div>}</div>
            </div>
          )}
          
          <div className={`h-6 border-t ${theme.border} ${theme.sidebarBg} flex items-center px-3 justify-between text-[10px] select-none flex-shrink-0`}>
            <div className="flex items-center space-x-3"><div className="flex items-center space-x-1 hover:text-blue-500 cursor-pointer"><GitBranch className="w-3 h-3" /><span>main*</span></div><div className="flex items-center space-x-1 hover:text-blue-500 cursor-pointer ml-2"><TerminalIcon className="w-3 h-3" /><span onClick={() => setShowTerminal(!showTerminal)}>Terminal</span></div></div>
            <div className="flex items-center space-x-4"><span className="cursor-pointer hover:text-blue-500">Connected as {currentUser.name}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ... (Sub-Components remain exactly as provided in previous snippets: FileTree, EditorArea, Minimap, ActivityIcon, Tab, getFileIcon, etc.)
function FileTree({ items, level = 0, activeId, selectedId, editingId, collaborators = [], onToggle, onSelect, onRename, onDelete, setEditingId, theme }) {
  return items.map(item => {
    const activeUsersHere = collaborators.filter(c => c.fileId === item.id);
    return (
    <div key={item.id}>
      <div className={`flex items-center py-1 px-2 cursor-pointer transition-colors text-xs select-none border-l-2 group ${item.id === selectedId ? 'bg-blue-500/20' : 'hover:bg-gray-500/10'} ${item.id === activeId ? 'text-blue-400 border-blue-400' : 'border-transparent'}`} style={{ paddingLeft: `${level * 12 + 12}px` }} onClick={() => { if (item.type === 'folder') { onToggle(item.id); onSelect(item.id, 'folder'); } else { onSelect(item.id, 'file'); } }}>
        <span className="mr-1.5 opacity-70">{item.type === 'folder' ? (item.isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />) : getFileIcon(item.name)}</span>
        {editingId === item.id ? ( <input autoFocus className={`${theme.inputBg} ${theme.inputText} border border-blue-500 rounded px-1 outline-none w-full h-5`} defaultValue={item.name} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') onRename(item.id, e.currentTarget.value); if (e.key === 'Escape') setEditingId(null); }} onBlur={(e) => onRename(item.id, e.currentTarget.value)} /> ) : ( <div className="flex-1 flex justify-between items-center overflow-hidden"><span className="truncate flex items-center">{item.name || 'Untitled'} {activeUsersHere.length > 0 && (<div className="flex -space-x-1 ml-2">{activeUsersHere.map(u => (<div key={u.id} className="w-2 h-2 rounded-full border border-black" style={{ backgroundColor: u.color }} />))}</div>)}</span><div className="hidden group-hover:flex items-center space-x-1 mr-1"><button className="hover:text-blue-400 p-0.5" onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}><Edit2 className="w-3 h-3" /></button><button className="hover:text-red-400 p-0.5" onClick={(e) => onDelete(e, item.id)}><Trash2 className="w-3 h-3" /></button></div></div> )}
      </div>
      {item.type === 'folder' && item.isOpen && item.children && (<FileTree items={item.children} level={level + 1} activeId={activeId} selectedId={selectedId} editingId={editingId} collaborators={collaborators} onToggle={onToggle} onSelect={onSelect} onRename={onRename} onDelete={onDelete} setEditingId={setEditingId} theme={theme} />)}
    </div>
  )});
}
function EditorArea({ theme, darkMode, code, onChange, onCursorChange }) { const handleChange = React.useCallback((val) => { onChange(val); }, [onChange]); const handleUpdate = React.useCallback((viewUpdate) => { if (viewUpdate.selectionSet) { const pos = viewUpdate.state.selection.main.head; const lineObj = viewUpdate.state.doc.lineAt(pos); if (onCursorChange) onCursorChange({ line: lineObj.number - 1, col: pos - lineObj.from }); } }, [onCursorChange]); return (<div className={`relative h-full overflow-hidden font-mono text-sm`}><CodeMirror value={code} height="100%" theme={darkMode ? githubDarkTheme : 'light'} extensions={[javascript({ jsx: true }), python()]} onChange={handleChange} onUpdate={handleUpdate} className="h-full" /></div>); }
function Minimap({ theme, code }) { return (<div className={`w-16 border-l ${theme.border} ${theme.bg} opacity-50 hidden md:block select-none overflow-hidden relative`}><div className="text-[2px] leading-[3px] p-1 text-gray-500 font-mono whitespace-pre text-left break-all">{code}</div></div>); }
function ActivityIcon({ icon: Icon, active, notification, onClick }) { return (<button onClick={onClick} className={`p-3 relative group transition-colors mb-2 ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}><Icon className="w-6 h-6" strokeWidth={1.5} />{active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />}{notification > 0 && <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full text-[10px] flex items-center justify-center text-white border border-[#0d1117]">{notification}</div>}</button>); }
function Tab({ name, active, theme, icon: Icon, color, onClick, onClose }) { return (<div onClick={onClick} className={`flex items-center px-3 h-full min-w-[120px] max-w-[180px] border-r ${theme.border} text-xs cursor-pointer group select-none relative ${active ? `${theme.tabActiveBg} ${theme.textActive} border-t-2 border-t-blue-500` : `${theme.tabInactiveBg} opacity-70 hover:opacity-100 hover:bg-gray-800/50`}`}>{Icon && <Icon className={`w-3.5 h-3.5 mr-2 ${color}`} />}<span className="truncate flex-1 mr-2">{name}</span><button onClick={onClose} className={`opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-gray-500/20 transition-all ${active ? 'text-white' : ''}`}><X className="w-3 h-3" /></button></div>); }
const getFileIcon = (name) => { if (name.endsWith('.jsx') || name.endsWith('.js')) return <FileCode className="w-3.5 h-3.5 text-yellow-400" />; if (name.endsWith('.css')) return <Hash className="w-3.5 h-3.5 text-blue-400" />; if (name.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-orange-400" />; return <File className="w-3.5 h-3.5 text-gray-400" />; };
const getFileIconIcon = (name) => { if (name.endsWith('.jsx') || name.endsWith('.js')) return FileCode; if (name.endsWith('.css')) return Hash; if (name.endsWith('.json')) return FileJson; return File; }
const getFileIconColor = (name) => { if (name.endsWith('.jsx') || name.endsWith('.js')) return 'text-yellow-400'; if (name.endsWith('.css')) return 'text-blue-400'; if (name.endsWith('.json')) return 'text-orange-400'; return 'text-gray-400'; }
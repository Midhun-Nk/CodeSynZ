import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Search, Settings, MoreVertical, Code2, GitBranch, Zap, FileCode, File,
  FileJson, ChevronRight, ChevronDown, X, FolderPlus, FilePlus, Menu,
  Sun, Moon, Hash, Terminal as TerminalIcon, Layout, Bell, AlertCircle,
  AlertTriangle, Edit2, Trash2, Users, UserPlus, Check, Ban, MousePointer2,
  Share2, Play, Loader2, LogOut, Package 
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python'; // Added Python support for demo
import { EditorView } from '@codemirror/view';
import { io } from 'socket.io-client'; 

// --- SOCKET SETUP ---
const socket = io('http://localhost:4000'); 

// Custom GitHub Dark Theme Definition
const githubDarkTheme = EditorView.theme({
  "&": { color: "#c9d1d9", backgroundColor: "#0d1117" },
  ".cm-content": { caretColor: "#c9d1d9" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "#c9d1d9" },
  "&.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "#163356" },
  ".cm-gutters": { backgroundColor: "#0d1117", color: "#8b949e", borderRight: "1px solid #30363d" },
  ".cm-activeLineGutter": { backgroundColor: "#163356" }
}, { dark: true });

export default function CodeEditor() {
  const [darkMode, setDarkMode] = useState(true);
  
  // -- Identity State --
  const [currentUser] = useState({
    name: "User_" + Math.floor(Math.random() * 1000),
    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
  });
  const roomId = "project-1"; 

  // -- UPDATED: File System State --
  // We now have a 'project' folder for multi-file demo and 'scripts' for single file demo
  const [files, setFiles] = useState([
    { id: '1', name: 'project', type: 'folder', isOpen: true, children: [
      { id: '2', name: 'main.js', type: 'file', lang: 'javascript', content: `// Multi-File Project Example
// Try "Run Project" to see this work!

const { add, subtract } = require('./utils');

console.log("--- Starting Project Execution ---");
console.log("Calculations from utils.js:");
console.log("5 + 10 =", add(5, 10));
console.log("20 - 8 =", subtract(20, 8));
console.log("--- End of Execution ---");` },
      { id: '3', name: 'utils.js', type: 'file', lang: 'javascript', content: `// Module exporting functions

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

module.exports = { add, subtract };` }
    ]},
    { id: '4', name: 'scripts', type: 'folder', isOpen: true, children: [
      { id: '5', name: 'hello.py', type: 'file', lang: 'python', content: `# Single File Python Example
# Try "Run File" to see this work!

import time

print("Hello from Python!")
print("Counting down...")

for i in range(5, 0, -1):
    print(f"Tick: {i}")

print("Blast off! 🚀")` },
      { id: '6', name: 'simple.js', type: 'file', lang: 'javascript', content: `// Simple JS Test
const greeting = "Hello World";
console.log(greeting.toUpperCase());` }
    ]}
  ]);

  // -- Navigation State --
  const [activeFileId, setActiveFileId] = useState('2'); // Default to main.js
  const [openFiles, setOpenFiles] = useState(['2', '3', '5']);
  const [selectedId, setSelectedId] = useState('2');
  const [sidebarView, setSidebarView] = useState('explorer'); 
  const [editingId, setEditingId] = useState(null);

  // -- Terminal / Execution State --
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: 'info', content: 'SyncCode Terminal v1.0.0' },
    { type: 'info', content: 'Ready.' }
  ]);
  const [isRunning, setIsRunning] = useState(false);

  // -- Collaboration State --
  const [collaborators, setCollaborators] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([
    { id: '999', name: 'Jane Doe', email: 'jane@example.com', color: '#ff5733' }
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);

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

  const getAllFiles = (list, path = "") => {
    let map = {};
    list.forEach(item => {
      if (item.type === 'file') {
        map[path + item.name] = item.content;
      } else if (item.children) {
        const childMap = getAllFiles(item.children, path + item.name + "/");
        Object.assign(map, childMap);
      }
    });
    return map;
  };

  const activeFile = findFileById(files, activeFileId);

  // --------------------------------------------------------------------------
  // SOCKET.IO REAL-TIME LOGIC
  // --------------------------------------------------------------------------
  useEffect(() => {
    socket.emit('join-room', { 
      roomId, 
      userName: currentUser.name, 
      color: currentUser.color 
    });

    socket.on('code-update', ({ fileId, code }) => {
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
      setCollaborators(prev => prev.map(c => 
        c.id === id ? { ...c, cursor, fileId } : c
      ));
    });

    socket.on('user-joined', (user) => {
      setCollaborators(prev => {
        if (prev.find(c => c.id === user.id)) return prev;
        return [...prev, { ...user, fileId: null }]; 
      });
      setTerminalOutput(prev => [...prev, { type: 'info', content: `> ${user.name} joined the session.` }]);
    });

    socket.on('sync-users', (users) => {
      const others = users.filter(u => u.id !== socket.id);
      setCollaborators(others);
    });

    socket.on('user-left', (userId) => {
      setCollaborators(prev => prev.filter(c => c.id !== userId));
    });

    return () => {
      socket.off('code-update');
      socket.off('cursor-update');
      socket.off('user-joined');
      socket.off('sync-users');
      socket.off('user-left');
    };
  }, [currentUser]); 


  // --------------------------------------------------------------------------
  // EXECUTION LOGIC 1: RUN SINGLE FILE (API)
  // --------------------------------------------------------------------------
  const runCode = async () => {
    if (!activeFile) return;
    
    setIsRunning(true);
    setShowTerminal(true);
    setTerminalOutput(prev => [...prev, { type: 'info', content: `> Run File: ${activeFile.name}...` }]);

    const langMap = {
      'js': 'nodejs', 'jsx': 'nodejs', 'py': 'python3',
      'java': 'java', 'cpp': 'cpp17', 'c': 'c', 'go': 'go'
    };
    
    const ext = activeFile.name.split('.').pop();
    const language = langMap[ext];

    if (!language) {
      setTerminalOutput(prev => [...prev, { type: 'error', content: `Error: Extension .${ext} not supported for execution.` }]);
      setIsRunning(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: activeFile.content,
          language: language,
          versionIndex: "0"
        })
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const data = await response.json();
      
      if (data.output) {
         setTerminalOutput(prev => [...prev, { type: 'success', content: data.output }]);
      } else if (data.error) {
         setTerminalOutput(prev => [...prev, { type: 'error', content: `Error: ${data.error}` }]);
      } else {
         setTerminalOutput(prev => [...prev, { type: 'info', content: 'Execution finished (No Output).' }]);
      }
    } catch (error) {
       console.error(error);
       setTerminalOutput(prev => [
         ...prev, 
         { type: 'error', content: 'Failed to connect to backend compiler.' }
       ]);
    }

    setIsRunning(false);
  };

  // --------------------------------------------------------------------------
  // EXECUTION LOGIC 2: RUN PROJECT (LOCAL)
  // --------------------------------------------------------------------------
  const runProject = async () => {
    setIsRunning(true);
    setShowTerminal(true);
    setTerminalOutput(prev => [...prev, { type: 'info', content: `> Compiling Project (Sending all files)...` }]);

    // 1. Flatten the file tree
    const allFiles = getAllFiles(files);

    try {
      // 2. Send to backend
      const response = await fetch('http://localhost:4000/run-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: allFiles,
          // UPDATED: Pointing to our new main entry file
          entryFile: "project/main.js" 
        })
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const data = await response.json();
      
      if (data.output) {
         setTerminalOutput(prev => [...prev, { type: 'success', content: data.output }]);
      } else if (data.error) {
         setTerminalOutput(prev => [...prev, { type: 'error', content: `Error: ${data.error}` }]);
      } else {
         setTerminalOutput(prev => [...prev, { type: 'info', content: 'Project finished.' }]);
      }
    } catch (error) {
       console.error(error);
       setTerminalOutput(prev => [
         ...prev, 
         { type: 'error', content: 'Failed to connect to Project Compiler.' }
       ]);
    }

    setIsRunning(false);
  };

  // --------------------------------------------------------------------------
  // COLLABORATION HANDLERS
  // --------------------------------------------------------------------------
  const handleSendInvite = () => {
    const newPending = { id: Date.now().toString(), name: 'New Developer', email: 'dev@test.com', color: '#2ecc71' };
    setPendingInvites(prev => [...prev, newPending]);
    setShowInviteModal(false);
    alert('Invite sent! (Check pending requests)');
  };

  const approveInvite = (id) => {
    const user = pendingInvites.find(u => u.id === id);
    if (user) {
      setCollaborators(prev => [...prev, { ...user, status: 'online', fileId: null, cursor: { line: 0, col: 0 } }]);
      setPendingInvites(prev => prev.filter(u => u.id !== id));
    }
  };

  const rejectInvite = (id) => {
    if(window.confirm("Reject this request?")) {
        setPendingInvites(prev => prev.filter(u => u.id !== id));
    }
  };

  const revokeAccess = (id) => {
    if (window.confirm("Revoke access for this user? They will be disconnected.")) {
      setCollaborators(prev => prev.filter(c => c.id !== id));
    }
  };

  // --------------------------------------------------------------------------
  // EVENT HANDLERS
  // --------------------------------------------------------------------------
  const handleCodeChange = useCallback((newContent) => {
    const updateContentRecursive = (list) => list.map(item => {
      if (item.id === activeFileId) return { ...item, content: newContent };
      if (item.children) return { ...item, children: updateContentRecursive(item.children) };
      return item;
    });
    setFiles(prev => updateContentRecursive(prev));
    socket.emit('code-change', { roomId, fileId: activeFileId, code: newContent });
  }, [activeFileId, roomId]);

  const handleLocalCursor = useCallback((cursorPos) => {
    socket.emit('cursor-move', { roomId, fileId: activeFileId, cursor: cursorPos });
  }, [activeFileId, roomId]);

  const handleFileSelect = (id, type) => {
    setSelectedId(id);
    if (type === 'file') {
      if (!openFiles.includes(id)) setOpenFiles([...openFiles, id]);
      setActiveFileId(id);
    }
  };

  const handleTabClick = (id) => { setActiveFileId(id); setSelectedId(id); };

  const handleCloseTab = (e, id) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(fileId => fileId !== id);
    setOpenFiles(newOpenFiles);
    if (activeFileId === id) {
      if (newOpenFiles.length > 0) {
        setActiveFileId(newOpenFiles[newOpenFiles.length - 1]);
        setSelectedId(newOpenFiles[newOpenFiles.length - 1]);
      } else {
        setActiveFileId(null);
        setSelectedId(null);
      }
    }
  };

  const handleToggleFolder = (id) => {
    const toggleRecursive = (list) => list.map(item => {
      if (item.id === id) return { ...item, isOpen: !item.isOpen };
      if (item.children) return { ...item, children: toggleRecursive(item.children) };
      return item;
    });
    setFiles(prev => toggleRecursive(prev));
  };

  const handleCreateItem = (type) => {
    const newId = Date.now().toString();
    const newItem = {
      id: newId, name: '', type: type, content: '',
      children: type === 'folder' ? [] : undefined, isOpen: true
    };
    let inserted = false;
    const addItemRecursive = (list) => {
      return list.map(item => {
        if (item.id === selectedId) {
          if (item.type === 'folder') {
            inserted = true;
            return { ...item, isOpen: true, children: [newItem, ...(item.children || [])] };
          }
        }
        if (item.children) {
           const isParentOfSelected = item.children.some(child => child.id === selectedId);
           if (isParentOfSelected) {
             const selectedItem = item.children.find(c => c.id === selectedId);
             if (selectedItem.type === 'file') {
               inserted = true;
               return { ...item, children: [...item.children, newItem] };
             }
           }
           return { ...item, children: addItemRecursive(item.children) };
        }
        return item;
      });
    };
    let newFiles = addItemRecursive(files);
    if (!inserted) newFiles = [...newFiles, newItem];
    setFiles(newFiles);
    setEditingId(newId);
  };

  const handleRename = (id, newName) => {
    if (!newName.trim()) return;
    const renameRecursive = (list) => list.map(item => {
      if (item.id === id) return { ...item, name: newName };
      if (item.children) return { ...item, children: renameRecursive(item.children) };
      return item;
    });
    setFiles(prev => renameRecursive(prev));
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this item?")) return;
    const deleteRecursive = (list) => list.filter(item => {
      if (item.id === id) return false;
      if (item.children) item.children = deleteRecursive(item.children);
      return true;
    });
    setFiles(prev => deleteRecursive(prev));
    if (activeFileId === id) handleCloseTab(e, id);
    if (openFiles.includes(id)) setOpenFiles(prev => prev.filter(fid => fid !== id));
  };

  return (
    <div className={`h-screen flex flex-col ${theme.bg} ${theme.text} overflow-hidden font-sans text-sm relative`}>
      
      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className={`${theme.sidebarBg} border ${theme.border} p-6 rounded-xl shadow-2xl w-96 animate-fade-in`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.textActive}`}>Invite Collaborator</h3>
              <button onClick={() => setShowInviteModal(false)}><X className="w-5 h-5 opacity-50 hover:opacity-100" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium opacity-70 mb-1">Email Address</label>
                <input type="email" placeholder="colleague@example.com" className={`w-full p-2 rounded-md bg-transparent border ${theme.border} outline-none focus:border-blue-500`} />
              </div>
              <button 
                onClick={handleSendInvite}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-md transition-colors"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={`h-10 border-b ${theme.border} ${theme.sidebarBg} flex items-center justify-between px-3 select-none`}>
        <div className="flex items-center space-x-3">
          <Menu className="w-4 h-4 opacity-70 cursor-pointer hover:opacity-100" />
          <span className="font-medium text-xs flex items-center opacity-80">
            File <span className="mx-2">Edit</span> <span className="mx-2">View</span>
          </span>
        </div>
        
        {/* Active File Title & Run Buttons */}
        <div className="flex-1 flex justify-center items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-md border ${theme.border} ${theme.bg} opacity-80 w-64 max-w-lg`}>
            <Search className="w-3 h-3 opacity-50" />
            <span className="text-xs opacity-50">SyncCode - {activeFile ? activeFile.name : 'No file'}</span>
          </div>
          
          {/* Button 1: Run Single File */}
          <button 
            onClick={runCode}
            disabled={isRunning || !activeFile}
            title="Run active file"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${isRunning ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
          >
             {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
             <span>Run File</span>
          </button>

          {/* Button 2: Run Project (NEW) */}
          <button 
            onClick={runProject}
            disabled={isRunning}
            title="Run entire project (Send all files)"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${isRunning ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
             {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
             <span>Run Project</span>
          </button>

        </div>

        {/* Right Actions: Theme, Presence */}
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2 mr-2">
            {collaborators.map(c => (
              <div key={c.id} className="w-6 h-6 rounded-full border-2 border-[#0d1117] flex items-center justify-center text-[10px] font-bold text-white relative group cursor-pointer" style={{ backgroundColor: c.color }}>
                {c.name[0].toUpperCase()}
                <span className="absolute top-7 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">
                  {c.name}
                </span>
              </div>
            ))}
            <button onClick={() => setShowInviteModal(true)} className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 border-2 border-[#0d1117] z-10">
              <UserPlus className="w-3 h-3" />
            </button>
          </div>
          <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-gray-500/10">
            {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className={`w-12 border-r ${theme.border} ${theme.activityBarBg} flex flex-col items-center py-2 z-20`}>
          <ActivityIcon icon={FileCode} active={sidebarView === 'explorer'} onClick={() => setSidebarView('explorer')} />
          <ActivityIcon icon={GitBranch} active={sidebarView === 'git'} onClick={() => setSidebarView('git')} notification={2} />
          <ActivityIcon icon={Users} active={sidebarView === 'collab'} onClick={() => setSidebarView('collab')} notification={pendingInvites.length} />
          <div className="flex-1" />
          <ActivityIcon icon={Settings} />
        </div>

        {/* Sidebar Content */}
        <div className={`w-60 border-r ${theme.border} ${theme.sidebarBg} flex flex-col`}>
          {sidebarView === 'explorer' && (
            <>
              <div className="flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider opacity-70">
                <span>Explorer</span>
                <MoreVertical className="w-4 h-4 cursor-pointer" />
              </div>
              <div className="px-2 pb-2 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between text-xs px-2 py-1 mb-2 font-bold opacity-80 group cursor-pointer hover:opacity-100">
                  <span className="flex items-center"><ChevronDown className="w-3 h-3 mr-1"/> {roomId.toUpperCase()}</span>
                  <div className="flex space-x-1">
                    <button onClick={() => handleCreateItem('file')} className="p-1 hover:bg-gray-500/10 rounded" title="New File"><FilePlus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleCreateItem('folder')} className="p-1 hover:bg-gray-500/10 rounded" title="New Folder"><FolderPlus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <FileTree 
                  items={files} activeId={activeFileId} selectedId={selectedId} editingId={editingId}
                  collaborators={collaborators}
                  onToggle={handleToggleFolder} onSelect={handleFileSelect} onRename={handleRename}
                  onDelete={handleDelete} setEditingId={setEditingId} theme={theme} 
                />
              </div>
            </>
          )}

          {sidebarView === 'collab' && (
            <>
              <div className="flex items-center justify-between p-3 text-xs font-bold uppercase tracking-wider opacity-70">
                <span>Collaboration</span>
              </div>
              <div className="p-2 space-y-6 overflow-y-auto">
                {/* Pending Requests */}
                <div>
                   <div className="text-[10px] font-bold opacity-50 mb-2 px-2 flex justify-between">
                     <span>PENDING REQUESTS</span>
                     <span className="bg-blue-600 text-white px-1.5 rounded-full">{pendingInvites.length}</span>
                   </div>
                   {pendingInvites.map(user => (
                     <div key={user.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-500/10 group mb-1">
                        <div className="flex flex-col min-w-0">
                           <span className="font-medium truncate">{user.name}</span>
                           <span className="text-[10px] opacity-50 truncate">{user.email}</span>
                        </div>
                        <div className="flex space-x-1">
                           <button onClick={() => approveInvite(user.id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded" title="Approve"><Check className="w-3.5 h-3.5"/></button>
                           <button onClick={() => rejectInvite(user.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded" title="Reject"><Ban className="w-3.5 h-3.5"/></button>
                        </div>
                     </div>
                   ))}
                   {pendingInvites.length === 0 && <span className="px-2 text-xs opacity-30 italic">No pending requests</span>}
                </div>
                <div className="h-px bg-gray-500/20"></div>
                {/* Online Users */}
                <div>
                  <div className="text-[10px] font-bold opacity-50 mb-2 px-2">ONLINE USERS</div>
                  {collaborators.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-500/10 group">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }}></div>
                        <div className="flex flex-col min-w-0">
                             <span className="truncate">{c.name}</span>
                             {c.fileId && <span className="text-[9px] opacity-40">editing...</span>}
                        </div>
                      </div>
                      <button onClick={() => revokeAccess(c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded" title="Revoke Access">
                         <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {collaborators.length === 0 && <span className="px-2 text-xs opacity-50">No one else is here.</span>}
                </div>
              </div>
            </>
          )}
          
          {!['explorer', 'collab'].includes(sidebarView) && (
            <div className="p-4 text-xs opacity-50 flex flex-col items-center justify-center h-full">Coming soon</div>
          )}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-hidden">
          {/* Editor Tabs */}
          <div className={`flex items-center ${theme.activityBarBg} border-b ${theme.border} overflow-x-auto scrollbar-hide h-9 flex-shrink-0`}>
            {openFiles.map(fileId => {
              const file = findFileById(files, fileId);
              if (!file) return null;
              return (
                <Tab key={file.id} name={file.name} active={activeFileId === file.id} theme={theme} 
                  icon={getFileIconIcon(file.name)} color={getFileIconColor(file.name)} 
                  onClick={() => handleTabClick(file.id)} onClose={(e) => handleCloseTab(e, file.id)}
                />
              );
            })}
          </div>

          {/* Editor + Minimap Area */}
          <div className="flex-1 flex overflow-hidden relative min-h-0">
            {activeFile ? (
              <>
                <div className="flex-1 relative h-full">
                  <EditorArea 
                    key={activeFile.id} theme={theme} darkMode={darkMode} code={activeFile.content} 
                    onChange={handleCodeChange} onCursorChange={handleLocalCursor} 
                  />
                  {/* Remote Cursor Overlay */}
                  {collaborators.map(c => {
                    if (c.fileId !== activeFileId) return null;
                    const top = 4 + (c.cursor?.line * 21 || 0);
                    const left = 50 + (c.cursor?.col * 8.4 || 0);
                    return (
                      <div key={c.id} className="absolute w-0.5 h-5 transition-all duration-100 pointer-events-none z-10"
                        style={{ top: `${top}px`, left: `${left}px`, backgroundColor: c.color, boxShadow: `0 0 8px ${c.color}` }}>
                        <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap" style={{ backgroundColor: c.color }}>
                          {c.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Minimap theme={theme} code={activeFile.content} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center opacity-30 flex-col">
                <Code2 className="w-16 h-16 mb-4" />
                <p>Select a file to start editing</p>
              </div>
            )}
          </div>

          {/* Terminal Panel */}
          {showTerminal && (
            <div className={`h-48 border-t ${theme.border} ${theme.terminalBg} flex flex-col font-mono text-xs flex-shrink-0 animate-in slide-in-from-bottom duration-200`}>
              <div className="flex items-center justify-between px-3 py-1 border-b border-[#30363d] opacity-80">
                <span className="font-bold">TERMINAL</span>
                <div className="flex space-x-2">
                   <button onClick={() => setTerminalOutput([])}><Trash2 className="w-3 h-3 hover:text-white" /></button>
                   <button onClick={() => setShowTerminal(false)}><X className="w-3 h-3 hover:text-white" /></button>
                </div>
              </div>
              <div className="flex-1 p-3 overflow-y-auto space-y-1">
                {terminalOutput.map((log, i) => (
                  <div key={i} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-400'}`}>
                    {log.content}
                  </div>
                ))}
                {isRunning && <div className="text-yellow-400 animate-pulse">_ Executing...</div>}
              </div>
            </div>
          )}
          
          {/* Status Panel */}
          <div className={`h-6 border-t ${theme.border} ${theme.sidebarBg} flex items-center px-3 justify-between text-[10px] select-none flex-shrink-0`}>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 hover:text-blue-500 cursor-pointer">
                <GitBranch className="w-3 h-3" /><span>main*</span>
              </div>
              <div className="flex items-center space-x-1 hover:text-blue-500 cursor-pointer ml-2">
                 <TerminalIcon className="w-3 h-3" />
                 <span onClick={() => setShowTerminal(!showTerminal)}>Terminal</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="cursor-pointer hover:text-blue-500">
                Connected as {currentUser.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------------

function FileTree({ items, level = 0, activeId, selectedId, editingId, collaborators = [], onToggle, onSelect, onRename, onDelete, setEditingId, theme }) {
  return items.map(item => {
    const activeUsersHere = collaborators.filter(c => c.fileId === item.id);
    return (
    <div key={item.id}>
      <div 
        className={`flex items-center py-1 px-2 cursor-pointer transition-colors text-xs select-none border-l-2 group
          ${item.id === selectedId ? 'bg-blue-500/20' : 'hover:bg-gray-500/10'}
          ${item.id === activeId ? 'text-blue-400 border-blue-400' : 'border-transparent'}
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => {
          if (item.type === 'folder') { onToggle(item.id); onSelect(item.id, 'folder'); } 
          else { onSelect(item.id, 'file'); }
        }}
      >
        <span className="mr-1.5 opacity-70">
          {item.type === 'folder' ? (item.isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />) : getFileIcon(item.name)}
        </span>
        
        {editingId === item.id ? (
          <input autoFocus className={`${theme.inputBg} ${theme.inputText} border border-blue-500 rounded px-1 outline-none w-full h-5`}
            defaultValue={item.name} onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter') onRename(item.id, e.currentTarget.value); if (e.key === 'Escape') setEditingId(null); }}
            onBlur={(e) => onRename(item.id, e.currentTarget.value)}
          />
        ) : (
          <div className="flex-1 flex justify-between items-center overflow-hidden">
            <span className="truncate flex items-center">
              {item.name || 'Untitled'}
              {/* Presence Dots */}
              {activeUsersHere.length > 0 && (
                <div className="flex -space-x-1 ml-2">
                  {activeUsersHere.map(u => (
                    <div key={u.id} className="w-2 h-2 rounded-full border border-black" style={{ backgroundColor: u.color }} title={u.name} />
                  ))}
                </div>
              )}
            </span>
            <div className="hidden group-hover:flex items-center space-x-1 mr-1">
              <button className="hover:text-blue-400 p-0.5" onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }}><Edit2 className="w-3 h-3" /></button>
              <button className="hover:text-red-400 p-0.5" onClick={(e) => onDelete(e, item.id)}><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
      {item.type === 'folder' && item.isOpen && item.children && (
        <FileTree items={item.children} level={level + 1} activeId={activeId} selectedId={selectedId} editingId={editingId} collaborators={collaborators}
          onToggle={onToggle} onSelect={onSelect} onRename={onRename} onDelete={onDelete} setEditingId={setEditingId} theme={theme} 
        />
      )}
    </div>
  )});
}

function EditorArea({ theme, darkMode, code, onChange, onCursorChange }) {
  const handleChange = React.useCallback((val) => { onChange(val); }, [onChange]);
  const handleUpdate = React.useCallback((viewUpdate) => {
    if (viewUpdate.selectionSet) {
      const pos = viewUpdate.state.selection.main.head;
      const lineObj = viewUpdate.state.doc.lineAt(pos);
      if (onCursorChange) onCursorChange({ line: lineObj.number - 1, col: pos - lineObj.from }); 
    }
  }, [onCursorChange]);

  return (
    <div className={`relative h-full overflow-hidden font-mono text-sm`}>
      <CodeMirror value={code} height="100%" theme={darkMode ? githubDarkTheme : 'light'}
        extensions={[javascript({ jsx: true }), python()]} onChange={handleChange} onUpdate={handleUpdate} className="h-full"
      />
    </div>
  );
}

function Minimap({ theme, code }) {
  return (
    <div className={`w-16 border-l ${theme.border} ${theme.bg} opacity-50 hidden md:block select-none overflow-hidden relative`}>
      <div className="text-[2px] leading-[3px] p-1 text-gray-500 font-mono whitespace-pre text-left break-all">{code}</div>
    </div>
  );
}

function ActivityIcon({ icon: Icon, active, notification, onClick }) {
  return (
    <button onClick={onClick} className={`p-3 relative group transition-colors mb-2 ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
      <Icon className="w-6 h-6" strokeWidth={1.5} />
      {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />}
      {notification && <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full text-[10px] flex items-center justify-center text-white border border-[#0d1117]">{notification}</div>}
    </button>
  );
}

function Tab({ name, active, theme, icon: Icon, color, onClick, onClose }) {
  return (
    <div onClick={onClick} className={`flex items-center px-3 h-full min-w-[120px] max-w-[180px] border-r ${theme.border} text-xs cursor-pointer group select-none relative ${active ? `${theme.tabActiveBg} ${theme.textActive} border-t-2 border-t-blue-500` : `${theme.tabInactiveBg} opacity-70 hover:opacity-100 hover:bg-gray-800/50`}`}>
      {Icon && <Icon className={`w-3.5 h-3.5 mr-2 ${color}`} />}
      <span className="truncate flex-1 mr-2">{name}</span>
      <button onClick={onClose} className={`opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-gray-500/20 transition-all ${active ? 'text-white' : ''}`}><X className="w-3 h-3" /></button>
    </div>
  );
}

const getFileIcon = (name) => {
  if (name.endsWith('.jsx') || name.endsWith('.js')) return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
  if (name.endsWith('.css')) return <Hash className="w-3.5 h-3.5 text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-orange-400" />;
  return <File className="w-3.5 h-3.5 text-gray-400" />;
};
const getFileIconIcon = (name) => {
  if (name.endsWith('.jsx') || name.endsWith('.js')) return FileCode;
  if (name.endsWith('.css')) return Hash;
  if (name.endsWith('.json')) return FileJson;
  return File;
}
const getFileIconColor = (name) => {
  if (name.endsWith('.jsx') || name.endsWith('.js')) return 'text-yellow-400';
  if (name.endsWith('.css')) return 'text-blue-400';
  if (name.endsWith('.json')) return 'text-orange-400';
  return 'text-gray-400';
}
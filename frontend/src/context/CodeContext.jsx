import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorView } from '@codemirror/view';
import axios from 'axios';
import { toast } from 'sonner';

export const CodeContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

// --- CONFIG ---
const API_URL = BACKEND_URL;
const SOCKET_URL = BACKEND_URL.replace('/api', '');
// --- HELPER: API FETCH ---
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const apiCall = async (endpoint, method = "GET", body = null) => {
  try {
    const res = await api({
      url: endpoint,
      method,
      data: body,
    });
    return res.data; 
  } catch (err) {
    console.log("AXIOS ERROR RESPONSE:", err.response?.data);
    throw new Error(
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "API error"
    );
  }
};

export const CodeProvider = ({ children }) => {

      const handleSendInvite = async (inviteEmail, inviteRole, PROJECT_ID, setPendingInvites, setInviteEmail, setShowInviteModal, setIsInviting) => {
    if (!inviteEmail) { toast.error("Please enter an email address"); return; }
    setIsInviting(true);
    try {
        await apiCall(`/projects/${PROJECT_ID}/invite`, 'POST', { email: inviteEmail, role: inviteRole });
        setPendingInvites(prev => [...prev, { id: Date.now(), email: inviteEmail, role: inviteRole }]);
        setInviteEmail('');
        setShowInviteModal(false);
        toast.success(`Invite sent successfully.`);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setIsInviting(false);
    }
  };


   const handleRequestAccess = async (
    PROJECT_ID, setIsRequestingAccess, setAccessRequestSent
   ) => {
    setIsRequestingAccess(true);
    try {
      await apiCall(`/projects/${PROJECT_ID}/request-access`, 'POST');
      setAccessRequestSent(true);
      toast.success("Request sent successfully.");
    } catch (err) {
      if(err.message.includes("already pending")) {
          setAccessRequestSent(true);
          toast.warning("Request is already pending.");
      } else {
          toast.error("Failed to send request: " + err.message);
      }
    } finally {
      setIsRequestingAccess(false);
    }
  };

    // 4. Handle Access Requests (Approve/Reject)
  const handleAccessRequestAction = async (user, action,
    PROJECT_ID, setAccessRequests, setProjectMembers
  ) => {
    if (!user || !user._id) return;
    try {
      await apiCall(`/projects/${PROJECT_ID}/access-requests/review`, "POST", {
        userId: user._id,
        status: action === "approve" ? "approved" : "rejected",
      });

      // Optimistic UI Update
      setAccessRequests((prev) => prev.filter((r) => r.user?._id !== user._id));

      if (action === "approve") {
        setProjectMembers((prev) => [
          ...prev,
          {
            id: user._id,
            name: user.username,
            email: user.email,
            role: "viewer", // Default
            color: "#888888",
          },
        ]);
        toast.success(`Request approved. ${user.username} added to team.`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

    // 3. Leave Project (SELF Removal)
  const handleLeaveProject = async (
    PROJECT_ID, currentUserId, navigate
  ) => {
    if (
      !window.confirm(
        "Are you sure you want to leave this project? You will lose access."
      )
    )
      return;
    try {
      await apiCall(
        `/projects/${PROJECT_ID}/collaborators/${currentUserId}`,
        "DELETE"
      );
      toast.success("You have left the project.");
      navigate("/");
    } catch (error) {
      toast.error("Failed to leave project: " + error.message);
    }
  };
  const handleRemoveMember = async (userId,
    PROJECT_ID, setProjectMembers, setOnlineUsers

  ) => {
    if (!window.confirm("Remove this user from the project?")) return;
    try {
      await apiCall(
        `/projects/${PROJECT_ID}/collaborators/${userId}`,
        "DELETE"
      );
      setProjectMembers((prev) => prev.filter((m) => m.id !== userId));
      setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User removed successfully.");
    } catch (error) {
      toast.error("Failed to remove user: " + error.message);
    }
  };

    const handleRoleChange = async (userId, newRole,
    PROJECT_ID, setProjectMembers,
  ) => {
    try {
      await apiCall(
        `/projects/${PROJECT_ID}/collaborators/${userId}`,
        "PATCH",
        { role: newRole }
      );
      setProjectMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );
    } catch (error) {
      toast.error("Error changing role: " + error.message);
    }
  };
 const handleRename = async (id, newName, PROJECT_ID, files, setFiles, creatingType, setCreatingType, setEditingId, handleFileSelect) => {
    if (!newName.trim()) {
      if (id.startsWith("temp_")) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setEditingId(null);
      }
      return;
    }
    const isCreating = id.startsWith("temp_");
    try {
      if (isCreating) {
        const findParentId = (list, childId, parentId = null) => {
          for (const item of list) {
            if (item.id === childId) return parentId;
            if (item.children) {
              const found = findParentId(item.children, childId, item.id);
              if (found) return found;
            }
          }
          return null;
        };
        const parentId = findParentId(files, id);
        const data = await apiCall(`/projects/${PROJECT_ID}/files`, "POST", {
          parentId: parentId,
          name: newName,
          type: creatingType,
        });
        const replaceRecursive = (list) =>
          list.map((item) => {
            if (item.id === id)
              return { ...item, id: data.id, name: data.name, isTemp: false };
            if (item.children)
              return { ...item, children: replaceRecursive(item.children) };
            return item;
          });
        setFiles((prev) => replaceRecursive(prev));
        setCreatingType(null);
        if (creatingType === "file") handleFileSelect(data.id, "file");
      } else {
        await apiCall(`/projects/${PROJECT_ID}/files/${id}/rename`, "PUT", {
          name: newName,
        });
        const renameRecursive = (list) =>
          list.map((item) => {
            if (item.id === id) return { ...item, name: newName };
            if (item.children)
              return { ...item, children: renameRecursive(item.children) };
            return item;
          });
        setFiles((prev) => renameRecursive(prev));
      }
    } catch (err) {
      toast.error(err.message);
    }
    setEditingId(null);
  };
 // --------------------------------------------------------------------------
  // HANDLERS (Files, Execution, Collab)
  // --------------------------------------------------------------------------
  const runCode = async (
    activeFile, setIsRunning, setShowTerminal, setTerminalOutput,
  ) => {
    if (!activeFile) return;
    setIsRunning(true);
    setShowTerminal(true);
    setTerminalOutput((prev) => [
      ...prev,
      { type: "info", content: `> Run File: ${activeFile.name}...` },
    ]);

    const langMap = {
      js: "nodejs",
      jsx: "nodejs",
      py: "python3",
      java: "java",
      cpp: "cpp17",
      c: "c",
      go: "go",
    };
    const ext = activeFile.name.split(".").pop();
    const language = langMap[ext];

    if (!language) {
      setTerminalOutput((prev) => [
        ...prev,
        { type: "error", content: `Error: Extension .${ext} not supported.` },
      ]);
      setIsRunning(false);
      return;
    }

    try {
      const data = await apiCall("/compiler/run", "POST", {
        script: activeFile.content,
        language: language,
        versionIndex: "0",
      });
      if (data.output)
        setTerminalOutput((prev) => [
          ...prev,
          { type: "success", content: data.output },
        ]);
      else
        setTerminalOutput((prev) => [
          ...prev,
          { type: "info", content: "Execution finished." },
        ]);
    } catch (error) {
      setTerminalOutput((prev) => [
        ...prev,
        { type: "error", content: `Error: ${error.message}` },
      ]);
    }
    setIsRunning(false);
  };

    // Helper for Recursion
  const getAllFiles = (list, path = ""

  ) => {
    let map = {};
    list.forEach((item) => {
      if (item.type === "file") {
        map[path + item.name] = item.content || "";
      } else if (item.children) {
        Object.assign(map, getAllFiles(item.children, path + item.name + "/"));
      }
    });
    return map;
  };


  const runProject = async (
    files, activeFile, setIsRunning, setShowTerminal, setTerminalOutput,
  ) => {
    setIsRunning(true);
    setShowTerminal(true);
    setTerminalOutput((prev) => [
      ...prev,
      { type: "info", content: `> Compiling Project...` },
    ]);
    const allFiles = getAllFiles(files);
    try {
      const data = await apiCall("/compiler/run-project", "POST", {
        files: allFiles,
        entryFile: activeFile ? activeFile.name : Object.keys(allFiles)[0],
      });
      if (data.output)
        setTerminalOutput((prev) => [
          ...prev,
          { type: "success", content: data.output },
        ]);
      else if (data.error)
        setTerminalOutput((prev) => [
          ...prev,
          { type: "error", content: `Error: ${data.error}` },
        ]);
      else
        setTerminalOutput((prev) => [
          ...prev,
          { type: "info", content: "Project finished." },
        ]);
    } catch (error) {
      setTerminalOutput((prev) => [
        ...prev,
        { type: "error", content: `Failed: ${error.message}` },
      ]);
    }
    setIsRunning(false);
  };


   const handleDelete = async (e, id, PROJECT_ID, files, setFiles, activeFileId, handleCloseTab, openFiles, setOpenFiles) => {
    e.stopPropagation();
    if (!window.confirm("Delete this item?")) return;
    try {
      await apiCall(`/projects/${PROJECT_ID}/files/${id}`, "DELETE");
      const deleteRecursive = (list) =>
        list.filter((item) => {
          if (item.id === id) return false;
          if (item.children) item.children = deleteRecursive(item.children);
          return true;
        });
      setFiles((prev) => deleteRecursive(prev));
      if (activeFileId === id) handleCloseTab(e, id);
      if (openFiles.includes(id))
        setOpenFiles((prev) => prev.filter((fid) => fid !== id));
    } catch (err) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  
  return (
    <CodeContext.Provider value={{
      // State
     apiCall,API_URL,SOCKET_URL,handleSendInvite,handleRequestAccess,handleAccessRequestAction,
        handleLeaveProject,handleRemoveMember,handleRoleChange,handleRename, handleDelete,runProject,runCode,getAllFiles
    }}>
      {children}
    </CodeContext.Provider>
  );
};
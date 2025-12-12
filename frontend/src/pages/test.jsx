// ... keep your existing hooks and logic above ...

  return (
    <div className={`h-screen flex flex-col ${CodeEditorTheme.bg} ${CodeEditorTheme.text} overflow-hidden font-sans text-sm relative selection:bg-blue-500/30`}>
      
      {/* --- INVITE MODAL (Keep as is) --- */}
      {showInviteModal && (
         // ... existing invite modal code ...
         <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
             {/* ... content ... */}
         </div>
      )}

      {/* --- RESPONSIVE TOP BAR --- */}
      <div className={`h-16 border-b ${CodeEditorTheme.border} ${CodeEditorTheme.sidebarBg} flex items-center justify-between px-4 md:px-6 select-none relative z-20 shadow-sm flex-shrink-0`}>
        
        {/* Left: Brand & Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600 hidden sm:block">
              SyncCode
            </span>
          </div>

          {/* Desktop Menu Items - Hidden on Mobile */}
          <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>
          <div className="hidden md:flex items-center space-x-1">
            {["File", "Edit", "View", "Go", "Help"].map(item => (
              <button key={item} className="px-3 py-1.5 rounded-lg text-sm opacity-60 hover:opacity-100 hover:bg-white/5 transition-colors">
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Search (Hidden on Mobile) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex items-center justify-center w-1/3">
           {/* ... existing search code ... */}
           <div className={`flex items-center w-full max-w-md px-4 py-2 rounded-xl border ${CodeEditorTheme.border} ${CodeEditorTheme.inputBg} opacity-80 hover:opacity-100 transition-all group`}>
              <Search className="w-4 h-4 opacity-40 group-hover:text-blue-400 transition-colors mr-3" />
              <span className="text-sm opacity-50 flex-1 truncate text-center">
                  {activeFile ? activeFile.name : "Search files (Ctrl+P)"}
              </span>
              <span className="text-[10px] border border-white/10 px-1.5 rounded text-opacity-40 text-white">⌘P</span>
           </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Run Actions (Condensed on Mobile) */}
          <div className="flex items-center bg-zinc-800/50 p-1 rounded-lg border border-white/5">
            <button
              onClick={(e) => runCode(activeFile, setIsRunning, setShowTerminal, setTerminalOutput)}
              disabled={isRunning || !activeFile}
              className="p-1.5 md:px-3 md:py-1.5 rounded-md bg-green-600/10 text-green-400 hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
              title="Run File"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button
               onClick={(e) => {
                 /* ... existing runProject logic ... */
                 if (!activeFile) {
                    setShowTerminal(true);
                    setTerminalOutput([{ type: "error", content: "Please select a file to run as the entry point." }]);
                    return;
                }
                const flatFileMap = generateFileMap(files);
                const entryPath = getActiveFilePath(files, activeFile.id);
                runProject(flatFileMap, entryPath, setIsRunning, setShowTerminal, setTerminalOutput);
               }}
               disabled={isRunning}
               className="p-1.5 md:px-3 md:py-1.5 rounded-md bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
               title="Run Project"
            >
              <Package className="w-4 h-4" />
            </button>
          </div>

          {/* Collaborators (Condensed on Mobile) */}
          <div className="flex items-center -space-x-2">
            {/* Show fewer users on mobile */}
            {onlineUsers.slice(0, 2).map((u) => (
               <div key={u.id} className="w-8 h-8 rounded-full border-2 border-zinc-900 flex items-center justify-center text-xs font-bold text-white relative z-10" style={{backgroundColor: u.color}}>
                  {u.name[0]}
               </div>
            ))}
            {onlineUsers.length > 2 && (
                <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-700 flex items-center justify-center text-xs font-bold text-white z-0">
                  +{onlineUsers.length - 2}
                </div>
            )}
            <button onClick={() => setShowInviteModal(true)} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-white/10 flex items-center justify-center text-white transition-colors ml-2">
                <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
             {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>
        </div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* MOBILE BACKDROP (Closes sidebar when clicking outside) */}
        {isMobileSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* --- SIDEBAR CONTAINER (Sliding Drawer on Mobile, Static on Desktop) --- */}
        <div className={`
            absolute md:static inset-y-0 left-0 z-40
            flex h-full transition-transform duration-300 ease-in-out
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          
          {/* Activity Bar */}
          <div className={`w-16 border-r ${CodeEditorTheme.border} ${CodeEditorTheme.activityBarBg} flex flex-col items-center py-6 gap-4`}>
             <ActivityIcon icon={FileCode} active={sidebarView === "explorer"} onClick={() => setSidebarView("explorer")} theme={CodeEditorTheme} />
             <ActivityIcon icon={Search} active={sidebarView === "search"} onClick={() => setSidebarView("search")} theme={CodeEditorTheme} />
             <ActivityIcon icon={GitBranch} active={sidebarView === "git"} onClick={() => setSidebarView("git")} theme={CodeEditorTheme} />
             <ActivityIcon icon={Users} active={sidebarView === "collab"} onClick={() => setSidebarView("collab")} notification={pendingInvites.length + accessRequests.length} theme={CodeEditorTheme} />
             <div className="flex-1" />
             <ActivityIcon icon={Settings} theme={CodeEditorTheme} />
             {/* User Profile (Mobile Visible here since top bar is crowded) */}
             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs mt-2 cursor-pointer shadow-md">
                 {currentUser.name[0]}
             </div>
          </div>

          {/* Sidebar Content (Explorer/Collab) */}
          <div className={`w-64 md:w-72 border-r ${CodeEditorTheme.border} ${CodeEditorTheme.sidebarBg} flex flex-col`}>
             {/* ... KEEP YOUR EXISTING SIDEBAR CONTENT LOGIC HERE (Explorer, Collab, etc.) ... */}
             {sidebarView === "explorer" && (
                <>
                  <div className="h-12 flex items-center justify-between px-5 border-b border-transparent">
                     <span className="text-xs font-bold uppercase tracking-widest opacity-60">Explorer</span>
                     <button className="opacity-50 hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                  {/* ... Project Title & FileTree ... */}
                  <div className="px-4 pb-2">
                     <div className="flex items-center justify-between group py-2">
                        <div className="flex items-center font-bold text-sm">
                           <ChevronDown className="w-4 h-4 mr-1 opacity-70" />
                           <span className="truncate max-w-[120px]">{'project'}</span>
                        </div>
                        <div className="flex space-x-1">
                           <button onClick={() => handleCreateItem("file")} className="p-1 hover:bg-white/10 rounded"><FilePlus className="w-4 h-4 text-blue-400" /></button>
                           <button onClick={() => handleCreateItem("folder")} className="p-1 hover:bg-white/10 rounded"><FolderPlus className="w-4 h-4 text-yellow-400" /></button>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
                     <FileTree
                        items={files}
                        activeId={activeFileId}
                        selectedId={selectedId}
                        editingId={editingId}
                        collaborators={onlineUsers}
                        onToggle={handleToggleFolder}
                        onSelect={handleFileSelect}
                        onRename={(id, newName) => handleRename(id, newName, PROJECT_ID, files, setFiles, creatingType, setCreatingType, setEditingId, handleFileSelect)}
                        onDelete={(e, id) => handleDelete(e, id, PROJECT_ID, files, setFiles, activeFileId, handleCloseTab, openFiles, setOpenFiles)}
                        setEditingId={setEditingId}
                        theme={CodeEditorTheme}
                     />
                  </div>
                </>
             )}
             
             {/* ... Keep Collab Sidebar Logic ... */}
             {sidebarView === "collab" && (
                <div className="flex flex-col h-full">
                   <div className="p-5 border-b border-white/5">
                      <h2 className="font-bold text-lg mb-1">Collaborators</h2>
                      <p className="text-xs opacity-50">Manage access and team members</p>
                   </div>
                   {/* ... Insert your existing Collab sidebar content here ... */}
                   {/* NOTE: Just copying the structure, ensure you include your inner map loops */}
                   <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {/* Access Requests */}
                      {amIOwner && accessRequests.length > 0 && (
                          // ... existing request logic ...
                          <div className="space-y-3">
                             {accessRequests.map((req) => (
                                <div key={req._id} className="p-3 bg-zinc-800/50 rounded-xl border border-orange-500/20 flex items-center justify-between">
                                   <div className="flex flex-col"><span className="font-medium text-sm">{req.user?.username}</span></div>
                                   {/* ... buttons ... */}
                                    <div className="flex gap-2">
                                      <button onClick={() => handleAccessRequestAction(req.user || { email: req.email }, "approve", PROJECT_ID, setAccessRequests, setProjectMembers)} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg"><Check className="w-4 h-4" /></button>
                                      <button onClick={() => handleAccessRequestAction(req.user || { email: req.email }, "reject", PROJECT_ID, setAccessRequests, setProjectMembers)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                             ))}
                          </div>
                      )}
                      {/* Team List (Reuse your loop) */}
                      <div className="space-y-3">
                         <div className="text-xs font-bold opacity-50 uppercase tracking-wider">Online Members</div>
                         {projectMembers.map(member => (
                            <div key={member.id} className="flex flex-col p-2 rounded hover:bg-gray-500/10 mb-1">
                               <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                     <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white">{member.name ? member.name[0] : "U"}</div>
                                     <span className="truncate font-medium">{member.name}</span>
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${onlineUsers.find(u => u.name === member.name) ? "bg-green-500" : "bg-gray-600"}`} />
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* --- MAIN EDITOR AREA --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-hidden h-full">
            
            {/* Editor Tabs - Scrollable on Mobile */}
            <div className={`flex items-end ${CodeEditorTheme.activityBarBg} h-10 flex-shrink-0 select-none overflow-x-auto scrollbar-hide`}>
              {openFiles.map((fileId) => {
                const file = findFileById(files, fileId);
                if (!file) return null;
                return (
                  <Tab
                    key={file.id}
                    name={file.name}
                    active={activeFileId === file.id}
                    theme={CodeEditorTheme}
                    onClick={() => handleTabClick(file.id)}
                    onClose={(e) => handleCloseTab(e, file.id)}
                  />
                );
              })}
            </div>

            {/* Breadcrumbs - Hidden on small mobile if too long */}
            <div className={`h-8 border-b ${CodeEditorTheme.border} ${CodeEditorTheme.bg} flex items-center px-4 justify-between text-xs flex-shrink-0`}>
                <div className="flex items-center gap-2 opacity-60 truncate">
                   <span>src</span>
                   {activeFile && (
                     <>
                       <ChevronRight className="w-3 h-3 flex-shrink-0" />
                       <span className="font-medium truncate">{activeFile.name}</span>
                     </>
                   )}
                </div>
                {/* File info hidden on small screens */}
                <div className="hidden sm:flex items-center gap-3 opacity-60">
                   <span className="hover:text-blue-400 cursor-pointer">Ln 1, Col 1</span>
                   <span className="hover:text-blue-400 cursor-pointer">JavaScript</span>
                </div>
            </div>

            {/* Code Mirror Area */}
            <div className="flex-1 flex overflow-hidden relative min-h-0">
               {activeFile ? (
                 <>
                   <div className="flex-1 relative h-full">
                      <EditorArea
                        key={activeFile.id}
                        theme={CodeEditorTheme}
                        darkMode={darkMode}
                        code={activeFile.content}
                        onChange={handleCodeChange}
                        onCursorChange={handleLocalCursor}
                      />
                      {/* Remote Cursors (Keep existing) */}
                      {onlineUsers.map(c => {
                          if (c.fileId !== activeFileId || !c.cursor) return null;
                          return (
                             <div key={c.id} className="absolute w-0.5 h-5 bg-yellow-500 z-50 pointer-events-none" style={{top: c.cursor.line * 24 + "px", left: c.cursor.col * 9 + "px"}}>
                                <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-yellow-500 text-black text-[10px] font-bold">{c.name}</div>
                             </div>
                          );
                      })}
                   </div>
                   {/* Minimap - Hidden on Mobile */}
                   <div className="hidden md:block">
                      <Minimap theme={CodeEditorTheme} code={activeFile.content} />
                   </div>
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none p-4 text-center">
                    <Code2 className="w-16 h-16 text-emerald-500/50 mb-4" />
                    <h2 className="text-xl font-bold">No file is open</h2>
                    <p className="text-sm mt-2">Open the sidebar to select a file.</p>
                 </div>
               )}
            </div>

            {/* Terminal Panel (Resonsive Height) */}
            {showTerminal && (
               <div className={`h-[40vh] md:h-64 border-t ${CodeEditorTheme.border} ${CodeEditorTheme.terminalBg} flex flex-col font-mono text-xs flex-shrink-0 animate-in slide-in-from-bottom duration-200 absolute bottom-0 w-full z-20 md:static`}>
                  {/* ... Keep existing terminal header & content ... */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                     <span className="font-bold text-emerald-400">TERMINAL</span>
                     <div className="flex gap-2">
                        <button onClick={() => setTerminalOutput([])}><Trash2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setShowTerminal(false)}><X className="w-3.5 h-3.5" /></button>
                     </div>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-1">
                     {terminalOutput.map((log, i) => (
                        <div key={i} className={`${log.type === "error" ? "text-red-400" : "text-zinc-400"} flex gap-2`}>
                           <span className="opacity-30">{new Date().toLocaleTimeString()}</span>
                           <span>{log.content}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
            
            {/* Status Bar */}
            <div className="h-6 bg-blue-600 text-white flex items-center px-3 justify-between text-[10px] font-medium select-none flex-shrink-0 z-30 relative">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1"><GitBranch className="w-3 h-3"/><span>main*</span></div>
               </div>
               <div className="flex items-center gap-4" onClick={() => setShowTerminal(!showTerminal)}>
                  <div className="flex items-center gap-1 cursor-pointer"><TerminalIcon className="w-3 h-3"/><span>Terminal</span></div>
               </div>
            </div>

        </div>
      </div>
    </div>
  );
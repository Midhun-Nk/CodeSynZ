import { EditorView } from "@codemirror/view";
import { ChevronDown, ChevronRight, Trash2,
    Edit2,

 } from "lucide-react";

import React from "react";
import { CodeMirror } from "@codemirror/react";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
// ----------------------------------------------------------------------------
// CodeMirror Theme
// ----------------------------------------------------------------------------



const githubDarkTheme = EditorView.theme({
  "&": { color: "#c9d1d9", backgroundColor: "#0d1117" },
  ".cm-content": { caretColor: "#c9d1d9" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "#c9d1d9" },
  "&.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "#163356" },
  ".cm-gutters": { backgroundColor: "#0d1117", color: "#8b949e", borderRight: "1px solid #30363d" },
  ".cm-activeLineGutter": { backgroundColor: "#163356" }
}, { dark: true });

// ----------------------------------------------------------------------------
// Sub-Components (UNCHANGED)
// ----------------------------------------------------------------------------

export function FileTree({ items, level = 0, activeId, selectedId, editingId, collaborators = [], onToggle, onSelect, onRename, onDelete, setEditingId, theme }) {
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

export function EditorArea({ theme, darkMode, code, onChange, onCursorChange }) {
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

export function Minimap({ theme, code }) {
  return (
    <div className={`w-16 border-l ${theme.border} ${theme.bg} opacity-50 hidden md:block select-none overflow-hidden relative`}>
      <div className="text-[2px] leading-[3px] p-1 text-gray-500 font-mono whitespace-pre text-left break-all">{code}</div>
    </div>
  );
}


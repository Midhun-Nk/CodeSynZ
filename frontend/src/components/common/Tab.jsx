
export function Tab({ name, active, theme, icon: Icon, color, onClick, onClose }) {
  return (
    <div onClick={onClick} className={`flex items-center px-3 h-full min-w-[120px] max-w-[180px] border-r ${theme.border} text-xs cursor-pointer group select-none relative ${active ? `${theme.tabActiveBg} ${theme.textActive} border-t-2 border-t-blue-500` : `${theme.tabInactiveBg} opacity-70 hover:opacity-100 hover:bg-gray-800/50`}`}>
      {Icon && <Icon className={`w-3.5 h-3.5 mr-2 ${color}`} />}
      <span className="truncate flex-1 mr-2">{name}</span>
      <button onClick={onClose} className={`opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-gray-500/20 transition-all ${active ? 'text-white' : ''}`}><X className="w-3 h-3" /></button>
    </div>
  );
}
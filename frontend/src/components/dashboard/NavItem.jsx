// Helper NavItem
export function NavItem({ icon: Icon, label, active, onClick, theme }) {
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
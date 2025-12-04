export function SettingsView({ theme, darkMode }) {
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

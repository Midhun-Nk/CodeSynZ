import { createContext, useContext, useEffect, useState } from "react";

// 1️⃣ Create Context
const ThemeContext = createContext();

// 2️⃣ Create Provider
export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(true);
    // Toggle Theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };
  // Dynamic classes based on theme
  const loginTheme = {
    bg: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
    text: darkMode ? 'text-zinc-100' : 'text-zinc-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-zinc-500',
    cardBg: darkMode ? 'bg-zinc-900/60' : 'bg-white/80',
    cardBorder: darkMode ? 'border-zinc-800' : 'border-zinc-200',
    leftPanelBg: darkMode ? 'bg-zinc-900/40' : 'bg-zinc-50/50',
    inputBg: darkMode ? 'bg-zinc-900/50' : 'bg-zinc-50',
    inputBorder: darkMode ? 'border-zinc-800' : 'border-zinc-200',
    inputText: darkMode ? 'text-zinc-100' : 'text-zinc-900',
    inputPlaceholder: darkMode ? 'placeholder-zinc-600' : 'placeholder-zinc-400',
    buttonSocialBg: darkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-zinc-50 hover:bg-zinc-100',
    buttonSocialBorder: darkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-200 hover:border-zinc-300',
    buttonSocialText: darkMode ? 'text-zinc-300' : 'text-zinc-700',
    divider: darkMode ? 'border-zinc-800' : 'border-zinc-200',
    dividerTextBg: darkMode ? 'bg-zinc-950' : 'bg-white',
    iconColor: darkMode ? 'text-zinc-500' : 'text-zinc-400',
    featureRowBg: darkMode ? 'bg-zinc-800/30 border-zinc-700/50' : 'bg-white/60 border-zinc-200',
    featureRowText: darkMode ? 'text-zinc-300' : 'text-zinc-700',
  };

  const dashboardTheme = {
    bg: darkMode ? 'bg-zinc-950' : 'bg-slate-50',
    text: darkMode ? 'text-zinc-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-slate-500',
    border: darkMode ? 'border-zinc-800' : 'border-slate-200',
    cardBg: darkMode ? 'bg-zinc-900/50' : 'bg-white',
    cardHover: darkMode ? 'hover:bg-zinc-900' : 'hover:bg-slate-50',
    sidebarBg: darkMode ? 'bg-zinc-950/95' : 'bg-white/90',
    inputBg: darkMode ? 'bg-zinc-900' : 'bg-white',
    inputBorder: darkMode ? 'border-transparent' : 'border-slate-200',
    accent: 'text-emerald-500',
    accentBg: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-400',
    shadowGlow: darkMode ? 'shadow-emerald-500/20' : 'shadow-slate-300/50',
    cardShadowHover: darkMode ? 'hover:shadow-emerald-500/10' : 'hover:shadow-slate-200',
  };


    const CodeEditorTheme = {
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


  
 
  

  return (
    <ThemeContext.Provider value={{
      darkMode,
      toggleTheme,
      loginTheme,dashboardTheme,CodeEditorTheme
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 5️⃣ Custom Hook (Best Practice)
export const useTheme = () => useContext(ThemeContext);

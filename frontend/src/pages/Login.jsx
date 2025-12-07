import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Mail, 
  Lock, 
  User, 
  Github, 
  Chrome, 
  ArrowRight, 
  Terminal, 
  Cpu, 
  Zap,
  Eye,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [animate, setAnimate] = useState(false);
  // const [darkMode, setDarkMode] = useState(true);

const [username, setUsername] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const {  darkMode,
      toggleTheme,
      loginTheme } = useTheme();

const { login, register, loading,loginWithGoogle, loginWithGithub } = useContext(AuthContext);
const navigate = useNavigate();


  // Trigger animation on mount
  useEffect(() => {
    setAnimate(true);
  }, []);

  // Toggle between Login and Signup modes
  const toggleMode = () => {
    setAnimate(false);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setAnimate(true);
    }, 200);
  };

  // // Toggle loginTheme
  // const toggleTheme = () => {
  //   setDarkMode(!darkMode);
  // };

  // Dynamic classes based on loginTheme
  // const loginTheme = {
  //   bg: darkMode ? 'bg-zinc-950' : 'bg-zinc-50',
  //   text: darkMode ? 'text-zinc-100' : 'text-zinc-900',
  //   textMuted: darkMode ? 'text-zinc-400' : 'text-zinc-500',
  //   cardBg: darkMode ? 'bg-zinc-900/60' : 'bg-white/80',
  //   cardBorder: darkMode ? 'border-zinc-800' : 'border-zinc-200',
  //   leftPanelBg: darkMode ? 'bg-zinc-900/40' : 'bg-zinc-50/50',
  //   inputBg: darkMode ? 'bg-zinc-900/50' : 'bg-zinc-50',
  //   inputBorder: darkMode ? 'border-zinc-800' : 'border-zinc-200',
  //   inputText: darkMode ? 'text-zinc-100' : 'text-zinc-900',
  //   inputPlaceholder: darkMode ? 'placeholder-zinc-600' : 'placeholder-zinc-400',
  //   buttonSocialBg: darkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-zinc-50 hover:bg-zinc-100',
  //   buttonSocialBorder: darkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-200 hover:border-zinc-300',
  //   buttonSocialText: darkMode ? 'text-zinc-300' : 'text-zinc-700',
  //   divider: darkMode ? 'border-zinc-800' : 'border-zinc-200',
  //   dividerTextBg: darkMode ? 'bg-zinc-950' : 'bg-white',
  //   iconColor: darkMode ? 'text-zinc-500' : 'text-zinc-400',
  //   featureRowBg: darkMode ? 'bg-zinc-800/30 border-zinc-700/50' : 'bg-white/60 border-zinc-200',
  //   featureRowText: darkMode ? 'text-zinc-300' : 'text-zinc-700',
  // };


  const handleSubmit = async (e) => {
  e.preventDefault();

  if (isLogin) {
    // LOGIN
    const res = await login(email, password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      alert(res.message);
    }
  } else {
    // REGISTER
    const res = await register(username, email, password);
    if (res.success) {
      alert("Account created! Please log in.");
      setIsLogin(true);
    } else {
      alert(res.message);
    }
  }
};


  return (
    <div className={`min-h-screen ${loginTheme.bg} ${loginTheme.text} flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200 transition-colors duration-500`}>
      
      {/* loginTheme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-50 p-3 rounded-full ${darkMode ? 'bg-zinc-900 text-yellow-400 border-zinc-800' : 'bg-white text-zinc-600 border-zinc-200'} border shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none`}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Background Decor: Abstract Code/Tech Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse ${darkMode ? 'opacity-100' : 'opacity-60'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse delay-700 ${darkMode ? 'opacity-100' : 'opacity-60'}`} />
        <div className={`absolute top-[20%] right-[20%] w-[20%] h-[20%] rounded-full blur-[80px] ${darkMode ? 'bg-zinc-800/20' : 'bg-zinc-300/30'}`} />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
      </div>

      <div className={`w-full max-w-5xl h-auto min-h-[600px] ${loginTheme.cardBg} backdrop-blur-xl border ${loginTheme.cardBorder} rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row transition-all duration-500 ease-in-out ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Left Side: Visual / Branding */}
        <div className={`w-full md:w-1/2 relative ${loginTheme.leftPanelBg} p-12 flex flex-col justify-between group overflow-hidden transition-colors duration-500`}>
          {/* Animated Background for Left Panel */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-8">
              <div className="bg-gradient-to-tr from-emerald-400 to-emerald-600 p-2 rounded-lg shadow-lg shadow-emerald-500/20">
                <Code2 className={`w-6 h-6 ${darkMode ? 'text-zinc-950' : 'text-white'}`} strokeWidth={2.5} />
              </div>
              <span className={`text-xl font-bold tracking-tight ${loginTheme.text}`}>
                Sync<span className="text-emerald-500">Code</span>
              </span>
            </div>

            <div className="space-y-6 mt-12">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Code together, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
                  in real-time.
                </span>
              </h1>
              <p className={`${loginTheme.textMuted} text-lg leading-relaxed max-w-md transition-colors duration-500`}>
                Experience zero-latency collaboration with integrated voice chat, live cursors, and instant deployment previews.
              </p>
            </div>
          </div>

          {/* Floating Feature Cards */}
          <div className="relative z-10 mt-12 space-y-4 hidden sm:block">
            <FeatureRow icon={Zap} text="Sub-millisecond latency sync" delay="0" loginTheme={loginTheme} />
            <FeatureRow icon={Terminal} text="Built-in terminal access" delay="100" loginTheme={loginTheme} />
            <FeatureRow icon={Cpu} text="Cloud-powered compilation" delay="200" loginTheme={loginTheme} />
          </div>

          {/* Decorative Code Snippet */}
          <div className={`absolute -bottom-12 -right-12 w-64 h-64 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl border p-4 opacity-50 rotate-[-12deg] shadow-2xl transition-colors duration-500`}>
            <div className="flex space-x-1.5 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
            <div className="space-y-1.5">
              <div className={`h-2 w-2/3 ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'} rounded`}></div>
              <div className={`h-2 w-3/4 ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'} rounded`}></div>
              <div className="h-2 w-1/2 bg-emerald-900/30 rounded"></div>
              <div className={`h-2 w-full ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'} rounded`}></div>
              <div className={`h-2 w-5/6 ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'} rounded`}></div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className={`w-full md:w-1/2 ${darkMode ? 'bg-zinc-950' : 'bg-white'} p-8 md:p-12 flex flex-col justify-center relative transition-colors duration-500`}>
          <div className={`transition-all duration-300 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            
            <div className="mb-8">
              <h2 className={`text-2xl font-bold ${loginTheme.text} mb-2`}>
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className={loginTheme.textMuted}>
                {isLogin 
                  ? 'Enter your credentials to access your workspace.' 
                  : 'Get started with your free developer account.'}
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button className={`flex items-center justify-center space-x-2 ${loginTheme.buttonSocialBg} border ${loginTheme.buttonSocialBorder} ${loginTheme.buttonSocialText} py-2.5 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`} onClick={loginWithGithub}>
                <Github className="w-5 h-5" />
                <span className="text-sm font-medium">Github</span>
              </button>
              <button className={`flex items-center justify-center space-x-2 ${loginTheme.buttonSocialBg} border ${loginTheme.buttonSocialBorder} ${loginTheme.buttonSocialText} py-2.5 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`} 
              onClick={loginWithGoogle}
              >
                <Chrome className="w-5 h-5" />
                <span className="text-sm font-medium">Google</span>
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${loginTheme.divider}`}></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className={`${loginTheme.dividerTextBg} px-3 ${loginTheme.textMuted} transition-colors duration-500`}>Or continue with</span>
              </div>
            </div>

            {/* Main Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>

              {!isLogin && (
                <div className="group">
                  <label className={`block text-xs font-medium ${loginTheme.textMuted} mb-1.5 ml-1`}>Username</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${loginTheme.iconColor} group-focus-within:text-emerald-500 transition-colors`}>
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      className={`block w-full pl-10 pr-3 py-2.5 ${loginTheme.inputBg} border ${loginTheme.inputBorder} rounded-xl ${loginTheme.inputText} ${loginTheme.inputPlaceholder} focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 sm:text-sm`}
                      placeholder="Midhun Mike"
                       value={username}
  onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className={`block text-xs font-medium ${loginTheme.textMuted} mb-1.5 ml-1`}>Email address</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${loginTheme.iconColor} group-focus-within:text-emerald-500 transition-colors`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    type="email" 
                    className={`block w-full pl-10 pr-3 py-2.5 ${loginTheme.inputBg} border ${loginTheme.inputBorder} rounded-xl ${loginTheme.inputText} ${loginTheme.inputPlaceholder} focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 sm:text-sm`}
                    placeholder="Mike@Studio.com"

                    value={email}
  onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className={`block text-xs font-medium ${loginTheme.textMuted}`}>Password</label>
                  {isLogin && (
                    <a href="#" className="text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${loginTheme.iconColor} group-focus-within:text-emerald-500 transition-colors`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    className={`block w-full pl-10 pr-10 py-2.5 ${loginTheme.inputBg} border ${loginTheme.inputBorder} rounded-xl ${loginTheme.inputText} ${loginTheme.inputPlaceholder} focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 sm:text-sm`}
                    placeholder="••••••••"
                    value={password}
    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${loginTheme.iconColor} hover:text-zinc-500 cursor-pointer transition-colors`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                <span>
  {loading 
    ? "Please wait..." 
    : isLogin 
      ? "Sign In" 
      : "Create Account"
  }
</span>

                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
              <p className={`text-sm ${loginTheme.textMuted}`}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={toggleMode}
                  className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors focus:outline-none hover:underline"
                >
                  {isLogin ? 'Sign up for free' : 'Sign in'}
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for the feature list
function FeatureRow({ icon: Icon, text, delay, loginTheme }) {
  return (
    <div className={`flex items-center space-x-3 ${loginTheme.featureRowText} p-3 rounded-lg ${loginTheme.featureRowBg} backdrop-blur-sm animate-fade-in-up transition-colors duration-500`} style={{ animationDelay: `${delay}ms` }}>
      <div className="bg-emerald-500/10 p-1.5 rounded text-emerald-500">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
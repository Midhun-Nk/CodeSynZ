import { AlertCircle, CheckCircle, GitBranch, Globe } from "lucide-react";

export function DeploymentsView({ theme, darkMode }) {
  const deployments = [
    { name: 'e-commerce-api-prod', commit: '8a2b9f', time: '2m ago', status: 'Live', branch: 'main' },
    { name: 'portfolio-v2-dev', commit: '4c3d1e', time: '1h ago', status: 'Building', branch: 'develop' },
  ];

  return (
    <div className="max-w-4xl animate-fade-in-up">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Deployments</h1>
      <p className={`${theme.textMuted} mb-8`}>Track your active builds and environments.</p>

      <div className="space-y-4">
        {deployments.map((deploy, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${theme.border} ${theme.cardBg} flex items-center justify-between shadow-sm`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${deploy.status === 'Live' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">{deploy.name}</h3>
                <div className={`flex items-center space-x-3 text-xs ${theme.textMuted} mt-1`}>
                  <span className="flex items-center"><GitBranch className="w-3 h-3 mr-1" /> {deploy.branch}</span>
                  <span>•</span>
                  <span className="font-mono">{deploy.commit}</span>
                  <span>•</span>
                  <span>{deploy.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {deploy.status === 'Live' ? (
                <span className="flex items-center text-emerald-500 text-sm font-medium"><CheckCircle className="w-4 h-4 mr-1.5" /> Live</span>
              ) : (
                <span className="flex items-center text-yellow-500 text-sm font-medium animate-pulse"><AlertCircle className="w-4 h-4 mr-1.5" /> Building...</span>
              )}
              <button className={`px-3 py-1.5 rounded-lg border ${theme.border} text-sm hover:bg-zinc-500/5`}>
                Logs
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
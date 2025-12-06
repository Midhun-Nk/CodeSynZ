import { CheckCircle, Clock, XCircle, Zap,Mail } from "lucide-react";

function CollabrationInvitations({ theme, darkMode, invites, onRespond }) {
  // We can also have a "Joined Projects" list here later.
  // For now, we focus on the pending invites as requested.

  return (
    <div className="max-w-4xl animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Collaboration</h1>
            <p className={`${theme.textMuted}`}>Manage project invitations and team access.</p>
        </div>
      </div>

      {/* 1. Pending Invitations Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-500" />
            Pending Invitations ({invites.length})
        </h2>

        {invites.length === 0 ? (
             <div className={`p-8 rounded-2xl border border-dashed ${theme.border} ${theme.cardBg} text-center`}>
                <p className={theme.textMuted}>You have no pending invitations at the moment.</p>
             </div>
        ) : (
            <div className={`grid gap-4`}>
                {invites.map((invite) => (
                    <div key={invite.projectId} className={`p-5 rounded-2xl border ${theme.border} ${theme.cardBg} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
                        <div className="flex items-start gap-4">
                             <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20`}>
                                {invite.projectName.substring(0, 2).toUpperCase()}
                             </div>
                             <div>
                                <h3 className="font-bold text-lg">{invite.projectName}</h3>
                                <div className={`flex items-center gap-3 text-sm ${theme.textMuted} mt-1`}>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Owner ID: {invite.ownerId.substring(0,6)}...
                                    </span>
                                    <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
                                    <span className="flex items-center gap-1 capitalize text-emerald-500">
                                        <Zap className="w-3 h-3" /> {invite.role} Access
                                    </span>
                                </div>
                                <p className={`text-xs ${theme.textMuted} mt-2 flex items-center gap-1`}>
                                    <Clock className="w-3 h-3" /> Invited {new Date(invite.sentAt).toLocaleDateString()}
                                </p>
                             </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => onRespond(invite.projectId, 'rejected')}
                                className={`px-4 py-2 rounded-xl border ${theme.border} hover:bg-zinc-500/10 font-medium text-sm transition-colors flex items-center gap-2`}
                            >
                                <XCircle className="w-4 h-4" /> Reject
                            </button>
                            <button 
                                onClick={() => onRespond(invite.projectId, 'accepted')}
                                className={`px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2`}
                            >
                                <CheckCircle className="w-4 h-4" /> Accept Invite
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

export default CollabrationInvitations;
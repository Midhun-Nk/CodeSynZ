
export const getFileIcon = (name) => {
  if (name.endsWith('.jsx') || name.endsWith('.js')) return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
  if (name.endsWith('.css')) return <Hash className="w-3.5 h-3.5 text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-orange-400" />;
  return <File className="w-3.5 h-3.5 text-gray-400" />;
};
export const getFileIconIcon = (name) => {
  if (name.endsWith('.jsx') || name.endsWith('.js')) return FileCode;
  if (name.endsWith('.css')) return Hash;
  if (name.endsWith('.json')) return FileJson;
  return File;
}
export const getFileIconColor = (name) => {
  if (name.endsWith('.jsx') || name.endsWith('.js')) return 'text-yellow-400';
  if (name.endsWith('.css')) return 'text-blue-400';
  if (name.endsWith('.json')) return 'text-orange-400';
  return 'text-gray-400';
}


export function ActivityIcon({ icon: Icon, active, notification, onClick }) {
  return (
    <button onClick={onClick} className={`p-3 relative group transition-colors mb-2 ${active ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
      <Icon className="w-6 h-6" strokeWidth={1.5} />
      {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />}
      {notification && <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full text-[10px] flex items-center justify-center text-white border border-[#0d1117]">{notification}</div>}
    </button>
  );
}

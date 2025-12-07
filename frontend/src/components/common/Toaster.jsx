import { Toaster as Sonner } from 'sonner';

export function Toaster({ darkMode }) {
  return (
    <Sonner
      theme={darkMode ? 'dark' : 'light'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: `
            group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-950 
            group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-lg
            
            dark:group-[.toaster]:bg-zinc-900 
            dark:group-[.toaster]:text-zinc-100 
            dark:group-[.toaster]:border-zinc-800
            dark:group-[.toaster]:shadow-xl dark:group-[.toaster]:shadow-emerald-500/5
            
            font-sans rounded-xl border p-4
          `,
          description: 'group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400',
          actionButton: 'group-[.toast]:bg-emerald-500 group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-zinc-400',
          
          // Specific styling for types
          error: 'group-[.toaster]:border-red-500/20 dark:group-[.toaster]:border-red-900/50',
          success: 'group-[.toaster]:border-emerald-500/20 dark:group-[.toaster]:border-emerald-900/50',
          warning: 'group-[.toaster]:border-yellow-500/20 dark:group-[.toaster]:border-yellow-900/50',
          info: 'group-[.toaster]:border-blue-500/20 dark:group-[.toaster]:border-blue-900/50',
        },
      }}
      // Use rich colors if you want the icons to be colored automatically
      richColors={false} 
      position="top-right"
    />
  );
}
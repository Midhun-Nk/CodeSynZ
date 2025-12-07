import { toast } from 'sonner';

function Demo() {
  return (
    <div className="space-x-2">
      <button onClick={() => {toast.success('Project created successfully', {
        description: `is ready for coding.`,
      });}}>
        Success
      </button>

      <button onClick={() => toast.error('Something went wrong')}>
        Error
      </button>

      <button onClick={() => toast.warning('Warning alert')}>
        Warning
      </button>

      <button onClick={() => toast.info('Info message')}>
        Info
      </button>
    </div>
  );
}

export default Demo;

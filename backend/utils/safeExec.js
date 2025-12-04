// utils/safeExec.js
import { spawn } from 'child_process';
import path from 'path';

export function runSandboxed({ cwd, entry, timeoutMs = 4000 }) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(entry).toLowerCase();

    let cmd, args;
    if (ext === '.js') {
      cmd = 'node'; args = [entry];
    } else if (ext === '.py') {
      cmd = 'python3'; args = [entry];
    } else {
      return reject(new Error('Unsupported entry file type'));
    }

    const child = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    let stdout = '';
    let stderr = '';

    const kill = () => {
      try { child.kill('SIGKILL'); } catch (e) {}
    };

    const timer = setTimeout(() => {
      kill();
      reject(new Error('Execution timed out'));
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return resolve({ error: stderr || `Exited with ${code}` });
      return resolve({ output: stdout });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      kill();
      reject(err);
    });
  });
}

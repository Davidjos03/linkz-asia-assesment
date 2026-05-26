const { execSync } = require('child_process');

const PORTS = [5173, 5174];

if (process.platform !== 'win32') {
  process.exit(0);
}

for (const port of PORTS) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();

    for (const line of output.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const pid = line.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[predev] Freed port ${port} (PID ${pid})`);
      } catch {
        // process may have already exited
      }
    }
  } catch {
    // port not in use
  }
}

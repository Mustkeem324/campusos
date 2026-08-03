const fs = require('fs');
async function check() {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      try {
        const log = fs.readFileSync('/home/nx-pro/.gemini/antigravity-cli/brain/c3901d99-ef6f-4192-8b18-46685a19872e/.system_generated/tasks/task-4341.log', 'utf8');
        if (log.includes('Done in') || log.includes('ERR!') || log.includes('failed') || log.includes('Success')) {
          clearInterval(timer);
          resolve(log);
        }
      } catch (e) {}
    }, 1000);
  });
}
check().then(console.log);

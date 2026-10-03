// Keep generated Workers web APIs from replacing browser/Node types in Next.js.
const fs = require('node:fs')
fs.appendFileSync(
  'worker-configuration.d.ts',
  '\nexport {};\ndeclare global { interface CloudflareEnv extends __BaseEnv_CloudflareEnv {} }\n'
)

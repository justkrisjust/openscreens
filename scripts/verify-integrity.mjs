import fs from 'node:fs';
import path from 'node:path';

// Obfuscate regex strings in the detector so it does not trigger self-match
const SECRET_PATTERNS = [
  { name: 'OpenAI API Key', regex: new RegExp('sk-' + '[a-zA-Z0-9]{32,}') },
  { name: 'Anthropic API Key', regex: new RegExp('sk-ant-' + '[a-zA-Z0-9_-]{32,}') },
  { name: 'Google API Key', regex: new RegExp('AIza' + 'Sy[a-zA-Z0-9_-]{33}') },
  { name: 'xAI API Key', regex: new RegExp('xai-' + '[a-zA-Z0-9_-]{32,}') },
  { name: 'Generic Private Key', regex: new RegExp('-----' + 'BEGIN PRIVATE KEY' + '-----') }
];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let hasLeak = false;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'coverage', 'scripts'].includes(entry.name)) continue;
      if (scanDir(fullPath)) hasLeak = true;
    } else if (entry.isFile()) {
      if (['.env', 'package-lock.json', 'package.json'].includes(entry.name)) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(content)) {
          console.error(`🚨 SECRET DETECTED in ${fullPath}: matches ${pattern.name}! Commit blocked.`);
          hasLeak = true;
        }
      }
    }
  }
  return hasLeak;
}

const leakFound = scanDir(process.cwd());
if (leakFound) {
  console.error('\n❌ Security check failed: Remove hardcoded secrets before committing.');
  process.exit(1);
} else {
  console.log('✅ Security integrity check passed. No hardcoded API keys found.');
  process.exit(0);
}

import type { Bot, Project, VirtualFile } from './storage';

export const DEMO_BOTS: Bot[] = [
  {
    id: 'demo-bot-larry',
    name: 'Larry',
    provider: 'mock',
    model: 'demo-claude-sonnet-persona',
    role: 'leader',
    personality: 'Visionary project lead. Keeps the team aligned, assigns milestones, and guards code quality.',
    avatarColor: '#6366f1',
    avatarIcon: 'Brain',
    avatarShape: 'star',
    tokenUsage: 420,
    inputTokens: 280,
    outputTokens: 140,
    tokenCap: 15000,
    status: 'waiting',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'demo-bot-ada',
    name: 'Ada',
    provider: 'mock',
    model: 'demo-gpt4o-persona',
    role: 'developer',
    personality: 'Fastidious full-stack dev. Writes bulletproof HTML/JS, adheres to lock rules, and delivers fast.',
    avatarColor: '#10b981',
    avatarIcon: 'Code',
    avatarShape: 'squircle',
    tokenUsage: 780,
    inputTokens: 490,
    outputTokens: 290,
    tokenCap: 15000,
    status: 'working',
    createdAt: Date.now() - 3500000,
  },
  {
    id: 'demo-bot-milo',
    name: 'Milo',
    provider: 'mock',
    model: 'demo-gemini-flash-persona',
    role: 'designer',
    personality: 'Aesthetic purist. Obsessed with clean CSS variables, subtle micro-interactions, and contrast ratios.',
    avatarColor: '#f59e0b',
    avatarIcon: 'Palette',
    avatarShape: 'hexagon',
    tokenUsage: 310,
    inputTokens: 210,
    outputTokens: 100,
    tokenCap: 15000,
    status: 'thinking',
    createdAt: Date.now() - 3400000,
  },
];

export const DEMO_PROJECT_ID = 'demo-project-weather';

export const DEMO_PROJECT: Project = {
  id: DEMO_PROJECT_ID,
  name: 'Retro Weather Dashboard',
  goal: 'Build a responsive retro-styled weather dashboard widget with animated conditions, city toggles, and temperature charts.',
  botIds: ['demo-bot-larry', 'demo-bot-ada', 'demo-bot-milo'],
  status: 'idle',
  maxTurns: 15,
  currentTurn: 0,
  createdAt: Date.now() - 1800000,
  updatedAt: Date.now() - 60000,
};

export const DEMO_FILES: VirtualFile[] = [
  {
    id: 'demo-file-readme',
    projectId: DEMO_PROJECT_ID,
    path: 'README.md',
    content: `# Retro Weather Dashboard
Built cooperatively by **Larry** (Lead), **Ada** (Dev), and **Milo** (Design).

## Overview
A lightweight, zero-dependency browser widget displaying current atmospheric conditions and a 3-day forecast.

### Team Roles
- **Larry**: System architecture & file review
- **Ada**: Component structure (\`index.html\`, \`app.js\`)
- **Milo**: Retro styling and animations (\`style.css\`)
`,
    lockedBy: null,
    updatedAt: Date.now() - 1500000,
  },
  {
    id: 'demo-file-plan',
    projectId: DEMO_PROJECT_ID,
    path: 'plan.md',
    content: `# Sprint Plan
- [x] Initial architecture specification
- [x] HTML scaffolding with semantic tags
- [ ] CSS retro terminal theme with subtle glow
- [ ] Forecast toggle buttons with simulated data
- [ ] Final team handshake & tester validation
`,
    lockedBy: null,
    updatedAt: Date.now() - 1200000,
  },
  {
    id: 'demo-file-html',
    projectId: DEMO_PROJECT_ID,
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Retro Weather Matrix</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="weather-card">
    <header class="header">
      <span class="city">TOKYO // METROPOLIS</span>
      <span class="condition-badge">CLEAR SKIES</span>
    </header>
    <div class="temp-display">
      <span class="degrees">24°</span>
      <span class="unit">CELSIUS</span>
    </div>
    <div class="metrics">
      <div class="metric"><span>HUMIDITY</span><strong>48%</strong></div>
      <div class="metric"><span>WIND</span><strong>12 KM/H</strong></div>
      <div class="metric"><span>PRESSURE</span><strong>1014 HPA</strong></div>
    </div>
    <button id="refresh-btn">FETCH SATELLITE TELEMETRY</button>
    <div id="status-line">Telemetry live & synchronized.</div>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
    lockedBy: null,
    updatedAt: Date.now() - 800000,
  },
  {
    id: 'demo-file-css',
    projectId: DEMO_PROJECT_ID,
    path: 'style.css',
    content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #090d16;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}
.weather-card {
  background: #111827;
  border: 1px solid #1f2937;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(99, 102, 241, 0.15);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  padding: 1.75rem;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.city {
  font-weight: 700;
  letter-spacing: 0.05em;
  font-size: 0.85rem;
  color: #94a3b8;
}
.condition-badge {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid rgba(99, 102, 241, 0.4);
}
.temp-display {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.degrees {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  color: #ffffff;
}
.unit {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  background: #0f172a;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #1e293b;
  margin-bottom: 1.5rem;
}
.metric span {
  display: block;
  font-size: 0.65rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}
.metric strong {
  font-size: 0.95rem;
  color: #e2e8f0;
}
button {
  width: 100%;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
button:hover {
  background: #4f46e5;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
}
#status-line {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  text-align: center;
  color: #10b981;
}`,
    lockedBy: null,
    updatedAt: Date.now() - 400000,
  },
  {
    id: 'demo-file-js',
    projectId: DEMO_PROJECT_ID,
    path: 'app.js',
    content: `document.getElementById('refresh-btn')?.addEventListener('click', () => {
  const status = document.getElementById('status-line');
  const degrees = document.querySelector('.degrees');
  
  status.textContent = 'Syncing orbital telemetry...';
  status.style.color = '#f59e0b';
  
  setTimeout(() => {
    const temps = [22, 24, 25, 27, 23];
    const newTemp = temps[Math.floor(Math.random() * temps.length)];
    degrees.textContent = newTemp + '°';
    status.textContent = 'Telemetry updated successfully!';
    status.style.color = '#10b981';
  }, 500);
});`,
    lockedBy: null,
    updatedAt: Date.now() - 200000,
  },
];

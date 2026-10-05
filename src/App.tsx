import React, { useEffect } from 'react';
import { Header } from './components/common/Header';
import { WipeDataModal } from './components/common/WipeDataModal';
import { LockedFeatureModal } from './components/common/LockedFeatureModal';
import { Toast } from './components/common/Toast';
import { OfficeCanvas } from './components/office/OfficeCanvas';
import { BotListView } from './components/bots/BotListView';
import { BotSetupModal } from './components/bots/BotSetupModal';
import { ProjectsView } from './components/projects/ProjectsView';
import { KeyVaultModal } from './components/security/KeyVaultModal';
import { CompatibilityModal } from './components/compatibility/CompatibilityModal';
import { SandboxedPreviewModal } from './components/preview/SandboxedPreviewModal';
import { useUIStore } from './stores/useUIStore';
import { useBotStore } from './stores/useBotStore';
import { useProjectStore } from './stores/useProjectStore';
import { useAuthStore } from './stores/useAuthStore';
import { useProjectRunner } from './hooks/useProjectRunner';

export const App: React.FC = () => {
  const { activeView } = useUIStore();
  const { loadBots } = useBotStore();
  const { loadProjects } = useProjectStore();
  const { checkSavedKeys } = useAuthStore();

  // Activate game loop turn runner
  useProjectRunner();

  // Initialize DB and state on first load
  useEffect(() => {
    loadBots();
    loadProjects();
    checkSavedKeys();
  }, [loadBots, loadProjects, checkSavedKeys]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation & Action Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeView === 'office' && <OfficeCanvas />}
        {activeView === 'bots' && <BotListView />}
        {activeView === 'projects' && <ProjectsView />}
        {activeView === 'keys' && <KeyVaultModal />}
        {activeView === 'compatibility' && <CompatibilityModal />}
        {activeView === 'preview' && <SandboxedPreviewModal />}
      </main>

      {/* Modals & Overlays */}
      <BotSetupModal />
      <WipeDataModal />
      <LockedFeatureModal />
      <Toast />
    </div>
  );
};

export default App;

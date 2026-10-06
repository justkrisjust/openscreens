import { create } from 'zustand';
import type {
  Project,
  ProjectEvent,
  VirtualFile,
  KnowledgeItem,
} from '../services/storage';
import {
  addProjectEvent,
  getAllProjects,
  getProjectEvents,
  getProjectFiles,
  saveProject,
  saveVirtualFile,
  deleteVirtualFile,
  deleteProject,
} from '../services/storage';
import { lockManager } from '../services/lockManager';
import { DEMO_FILES, DEMO_PROJECT } from '../services/demoData';

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  files: VirtualFile[];
  selectedFileId: string | null;
  events: ProjectEvent[];
  activeLocks: Record<string, { botId: string; botName: string }>;
  pausedBotIds: Set<string>;
  isExecutingTurn: boolean;

  // Actions
  loadProjects: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (
    name: string,
    goal: string,
    botIds: string[],
    knowledgeBase?: KnowledgeItem[],
    localFolderPath?: string
  ) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  addKnowledgeItems: (projectId: string, items: KnowledgeItem[]) => Promise<void>;
  removeKnowledgeItem: (projectId: string, itemId: string) => Promise<void>;
  setLocalFolderPath: (projectId: string, path: string) => Promise<void>;

  // Virtual Files & Lock Actions
  loadFiles: (projectId: string) => Promise<void>;
  selectFile: (fileId: string | null) => void;
  createVirtualFile: (path: string, content?: string) => Promise<VirtualFile>;
  updateVirtualFileContent: (
    fileId: string,
    content: string,
    botId?: string,
    botName?: string,
    summary?: string
  ) => Promise<boolean>;
  deleteVirtualFileById: (fileId: string) => Promise<void>;
  refreshLocks: () => void;

  // Events
  loadEvents: (projectId: string) => Promise<void>;
  logEvent: (
    botId: string,
    botName: string,
    type: ProjectEvent['type'],
    summary: string,
    filePath?: string,
    tokensUsed?: number
  ) => Promise<void>;

  // Execution & Controls
  startProjectExecution: () => void;
  pauseProjectExecution: () => void;
  stopProjectExecution: () => void;
  addTurns: (count?: number) => void;
  assignFileToBot: (fileId: string, botId: string, botName: string) => Promise<boolean>;
  unassignFile: (fileId: string) => Promise<void>;
  toggleBotPause: (botId: string) => void;
  incrementTurn: () => void;
  setIsExecutingTurn: (executing: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  files: [],
  selectedFileId: null,
  events: [],
  activeLocks: {},
  pausedBotIds: new Set(),
  isExecutingTurn: false,

  loadProjects: async () => {
    try {
      let storedProjects = await getAllProjects();
      if (storedProjects.length === 0) {
        // Seed initial demo project and files
        await saveProject(DEMO_PROJECT);
        for (const file of DEMO_FILES) {
          await saveVirtualFile(file);
        }
        storedProjects = [DEMO_PROJECT];
      }

      set({ projects: storedProjects });
      if (!get().activeProject && storedProjects.length > 0) {
        await get().selectProject(storedProjects[0].id);
      }
    } catch (err) {
      console.warn('Project load fallback:', err);
      set({ projects: [DEMO_PROJECT], activeProject: DEMO_PROJECT, files: DEMO_FILES });
    }
  },

  selectProject: async (projectId: string) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return;

    set({ activeProject: project });
    await get().loadFiles(projectId);
    await get().loadEvents(projectId);
    get().refreshLocks();
  },

  createProject: async (name, goal, botIds, knowledgeBase = [], localFolderPath) => {
    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      goal,
      botIds,
      status: 'idle',
      maxTurns: 20,
      currentTurn: 0,
      knowledgeBase,
      localFolderPath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProject(newProject);
    set((state) => ({
      projects: [newProject, ...state.projects],
      activeProject: newProject,
    }));

    // Create initial README and plan files
    const readmeFile: VirtualFile = {
      id: `file-${Date.now()}-readme`,
      projectId: newProject.id,
      path: 'README.md',
      content: `# ${name}\n\n**Goal**: ${goal}\n\nVirtual files will be generated collaboratively by team bots.`,
      updatedAt: Date.now(),
    };

    const planFile: VirtualFile = {
      id: `file-${Date.now()}-plan`,
      projectId: newProject.id,
      path: 'plan.md',
      content: `# Project Plan\n\n1. Define system specifications\n2. Scaffold components\n3. Verification & test`,
      updatedAt: Date.now(),
    };

    await saveVirtualFile(readmeFile);
    await saveVirtualFile(planFile);

    await get().loadFiles(newProject.id);
    return newProject;
  },

  updateProject: async (id, updates) => {
    const target = get().projects.find((p) => p.id === id) || (get().activeProject?.id === id ? get().activeProject : null);
    if (!target) return;

    const updated = { ...target, ...updates, updatedAt: Date.now() };
    await saveProject(updated);
    set((state) => ({
      activeProject: state.activeProject?.id === id ? updated : state.activeProject,
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  removeProject: async (id) => {
    await deleteProject(id);
    set((state) => {
      const remaining = state.projects.filter((p) => p.id !== id);
      return {
        projects: remaining,
        activeProject: remaining.length > 0 ? remaining[0] : null,
      };
    });
    if (get().activeProject) {
      await get().loadFiles(get().activeProject!.id);
    }
  },

  addKnowledgeItems: async (projectId, items) => {
    const active = get().activeProject;
    if (!active || active.id !== projectId) return;
    const currentList = active.knowledgeBase || [];
    const updatedList = [...currentList, ...items];
    await get().updateProject(projectId, { knowledgeBase: updatedList });
  },

  removeKnowledgeItem: async (projectId, itemId) => {
    const active = get().activeProject;
    if (!active || active.id !== projectId) return;
    const currentList = active.knowledgeBase || [];
    const updatedList = currentList.filter((k) => k.id !== itemId);
    await get().updateProject(projectId, { knowledgeBase: updatedList });
  },

  setLocalFolderPath: async (projectId, folderPath) => {
    const active = get().activeProject;
    if (!active || active.id !== projectId) return;
    await get().updateProject(projectId, { localFolderPath: folderPath });
  },

  loadFiles: async (projectId: string) => {
    try {
      const projectFiles = await getProjectFiles(projectId);
      set({
        files: projectFiles,
        selectedFileId: projectFiles.length > 0 ? projectFiles[0].id : null,
      });
      get().refreshLocks();
    } catch (e) {
      console.warn('Error loading files:', e);
    }
  },

  selectFile: (fileId) => {
    set({ selectedFileId: fileId });
  },

  createVirtualFile: async (path, content = '') => {
    const active = get().activeProject;
    if (!active) throw new Error('No active project');

    const newFile: VirtualFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: active.id,
      path: path.trim().replace(/^\/+/, ''),
      content,
      updatedAt: Date.now(),
    };

    await saveVirtualFile(newFile);
    set((state) => ({
      files: [...state.files, newFile],
      selectedFileId: newFile.id,
    }));
    return newFile;
  },

  updateVirtualFileContent: async (fileId, content, botId, botName, summary) => {
    const active = get().activeProject;
    if (!active) return false;

    const target = get().files.find((f) => f.id === fileId);
    if (!target) return false;

    // Check lock if edited by a bot
    if (botId && botName) {
      const lockRes = lockManager.acquireLock(active.id, target.path, botId, botName);
      if (lockRes.busy) {
        await get().logEvent(
          botId,
          botName,
          'lock_busy',
          `Cannot edit ${target.path}: busy, pick another task (locked by ${lockRes.heldBy?.botName})`,
          target.path
        );
        return false;
      }
    }

    const updated: VirtualFile = {
      ...target,
      content,
      lastSummary: summary || (botName ? `Updated by ${botName}` : target.lastSummary),
      updatedAt: Date.now(),
    };

    await saveVirtualFile(updated);
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? updated : f)),
    }));

    if (botId && botName) {
      lockManager.releaseLock(active.id, target.path, botId);
      get().refreshLocks();
    }

    return true;
  },

  deleteVirtualFileById: async (fileId) => {
    await deleteVirtualFile(fileId);
    set((state) => {
      const remaining = state.files.filter((f) => f.id !== fileId);
      return {
        files: remaining,
        selectedFileId: remaining.length > 0 ? remaining[0].id : null,
      };
    });
  },

  refreshLocks: () => {
    const active = get().activeProject;
    if (!active) return;
    const locks = lockManager.getProjectLocks(active.id);
    set({ activeLocks: locks });
  },

  loadEvents: async (projectId: string) => {
    try {
      const events = await getProjectEvents(projectId);
      set({ events });
    } catch {
      set({ events: [] });
    }
  },

  logEvent: async (botId, botName, type, summary, filePath, tokensUsed) => {
    const active = get().activeProject;
    if (!active) return;

    const event: ProjectEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: active.id,
      botId,
      botName,
      type,
      summary,
      filePath,
      tokensUsed,
      timestamp: Date.now(),
    };

    await addProjectEvent(event);
    set((state) => ({ events: [...state.events, event] }));
  },

  startProjectExecution: () => {
    const active = get().activeProject;
    if (!active) return;
    const updates: Partial<Project> = { status: 'running' };
    if (active.currentTurn >= active.maxTurns) {
      updates.maxTurns = active.currentTurn + 15;
    }
    get().updateProject(active.id, updates);
  },

  pauseProjectExecution: () => {
    const active = get().activeProject;
    if (!active) return;
    get().updateProject(active.id, { status: 'paused' });
  },

  stopProjectExecution: () => {
    const active = get().activeProject;
    if (!active) return;
    lockManager.clearProjectLocks(active.id);
    get().updateProject(active.id, { status: 'idle' });
    set({ isExecutingTurn: false, activeLocks: {} });
  },

  addTurns: (count = 10) => {
    const active = get().activeProject;
    if (!active) return;
    get().updateProject(active.id, { maxTurns: active.maxTurns + count });
  },

  assignFileToBot: async (fileId, botId, botName) => {
    const active = get().activeProject;
    if (!active) return false;
    const file = get().files.find((f) => f.id === fileId);
    if (!file) return false;

    // If already held by another bot, release first to allow reassignment
    if (file.lockedBy && file.lockedBy !== botId) {
      lockManager.releaseLock(active.id, file.path, file.lockedBy);
    }

    const lockResult = lockManager.acquireLock(active.id, file.path, botId, botName);
    if (!lockResult.success) return false;

    const updatedFile: VirtualFile = {
      ...file,
      lockedBy: botId,
      lockAcquiredAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveVirtualFile(updatedFile);

    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? updatedFile : f)),
      activeLocks: lockManager.getProjectLocks(active.id),
    }));

    await get().logEvent(
      botId,
      botName,
      'file_edit',
      `${botName} picked up task on ${file.path}`,
      file.path
    );
    return true;
  },

  unassignFile: async (fileId) => {
    const active = get().activeProject;
    if (!active) return;
    const file = get().files.find((f) => f.id === fileId);
    if (!file || !file.lockedBy) return;

    const prevBotId = file.lockedBy;
    lockManager.releaseLock(active.id, file.path, prevBotId);

    const updatedFile: VirtualFile = {
      ...file,
      lockedBy: null,
      lockAcquiredAt: null,
      updatedAt: Date.now(),
    };
    await saveVirtualFile(updatedFile);

    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? updatedFile : f)),
      activeLocks: lockManager.getProjectLocks(active.id),
    }));

    await get().logEvent(
      prevBotId,
      'System',
      'system',
      `File ${file.path} released and unassigned`,
      file.path
    );
  },

  toggleBotPause: (botId: string) => {
    set((state) => {
      const next = new Set(state.pausedBotIds);
      if (next.has(botId)) next.delete(botId);
      else next.add(botId);
      return { pausedBotIds: next };
    });
  },

  incrementTurn: () => {
    const active = get().activeProject;
    if (!active) return;
    const nextTurn = active.currentTurn + 1;
    const status = nextTurn >= active.maxTurns ? 'completed' : active.status;
    get().updateProject(active.id, { currentTurn: nextTurn, status });
  },

  setIsExecutingTurn: (executing) => {
    set({ isExecutingTurn: executing });
  },
}));

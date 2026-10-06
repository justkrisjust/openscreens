import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { EncryptedPayload } from './crypto';

export type ProviderId = 'anthropic' | 'gemini' | 'openai' | 'xai' | 'mistral' | 'mock' | 'ollama';

export type BotRole = 'leader' | 'developer' | 'designer' | 'tester' | 'reviewer' | 'architect';
export type BotGesture = 'working' | 'thinking' | 'blocked' | 'needs_help' | 'done' | 'waiting';

export type BotShape =
  | 'circle'
  | 'squircle'
  | 'box'
  | 'star'
  | 'hexagon'
  | 'diamond'
  | 'shield'
  | 'capsule'
  | 'heart'
  | 'octagon';

export interface Bot {
  id: string;
  name: string;
  provider: ProviderId;
  model: string;
  role: BotRole;
  personality: string;
  avatarColor: string;
  avatarIcon: string;
  avatarShape?: BotShape;
  tokenUsage: number;
  inputTokens?: number;
  outputTokens?: number;
  tokenCap: number; // e.g. 10000
  status: BotGesture;
  currentTask?: string;
  createdAt: number;
}

export interface VirtualFile {
  id: string;
  projectId: string;
  path: string; // e.g. "plan.md", "src/index.html"
  content: string;
  lockedBy?: string | null; // botId currently editing
  lockAcquiredAt?: number | null;
  lastSummary?: string;
  updatedAt: number;
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  botId: string;
  botName: string;
  type: 'file_edit' | 'file_read' | 'chat_message' | 'lock_busy' | 'gesture' | 'system';
  summary: string;
  filePath?: string;
  tokensUsed?: number;
  timestamp: number;
}

export interface KnowledgeItem {
  id: string;
  projectId: string;
  name: string;
  type: 'markdown' | 'text' | 'pdf' | 'image' | 'json' | 'code' | 'folder';
  size: number;
  path?: string;
  content?: string;
  dataUrl?: string;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  goal: string;
  botIds: string[];
  status: 'idle' | 'running' | 'paused' | 'completed';
  maxTurns: number; // stop bot-to-bot looping
  currentTurn: number;
  knowledgeBase?: KnowledgeItem[];
  localFolderPath?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KeyRecord {
  provider: ProviderId;
  encryptedPayload: EncryptedPayload;
  updatedAt: number;
}

interface OpenScreensDB extends DBSchema {
  keys: {
    key: ProviderId;
    value: KeyRecord;
  };
  bots: {
    key: string;
    value: Bot;
    indexes: { 'by-provider': ProviderId };
  };
  projects: {
    key: string;
    value: Project;
  };
  files: {
    key: string;
    value: VirtualFile;
    indexes: { 'by-project': string; 'by-project-path': [string, string] };
  };
  events: {
    key: string;
    value: ProjectEvent;
    indexes: { 'by-project': string; 'by-project-time': [string, number] };
  };
}

const DB_NAME = 'openscreens_db_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OpenScreensDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<OpenScreensDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OpenScreensDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'provider' });
        }
        if (!db.objectStoreNames.contains('bots')) {
          const botStore = db.createObjectStore('bots', { keyPath: 'id' });
          botStore.createIndex('by-provider', 'provider');
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('by-project', 'projectId');
          fileStore.createIndex('by-project-path', ['projectId', 'path']);
        }
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('by-project', 'projectId');
          eventStore.createIndex('by-project-time', ['projectId', 'timestamp']);
        }
      },
    });
  }
  return dbPromise;
}

// Key Storage
export async function saveEncryptedKey(record: KeyRecord): Promise<void> {
  const db = await getDB();
  await db.put('keys', record);
}

export async function getEncryptedKey(provider: ProviderId): Promise<KeyRecord | undefined> {
  const db = await getDB();
  return db.get('keys', provider);
}

export async function getAllEncryptedKeys(): Promise<KeyRecord[]> {
  const db = await getDB();
  return db.getAll('keys');
}

export async function deleteEncryptedKey(provider: ProviderId): Promise<void> {
  const db = await getDB();
  await db.delete('keys', provider);
}

// Bot Storage
export async function saveBot(bot: Bot): Promise<void> {
  const db = await getDB();
  await db.put('bots', bot);
}

export async function getBot(id: string): Promise<Bot | undefined> {
  const db = await getDB();
  return db.get('bots', id);
}

export async function getAllBots(): Promise<Bot[]> {
  const db = await getDB();
  return db.getAll('bots');
}

export async function deleteBot(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bots', id);
}

// Project Storage
export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll('projects');
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['projects', 'files', 'events'], 'readwrite');
  await tx.objectStore('projects').delete(id);

  // Clean files and events for this project
  const fileIdx = tx.objectStore('files').index('by-project');
  let fileCursor = await fileIdx.openCursor(id);
  while (fileCursor) {
    await fileCursor.delete();
    fileCursor = await fileCursor.continue();
  }

  const eventIdx = tx.objectStore('events').index('by-project');
  let eventCursor = await eventIdx.openCursor(id);
  while (eventCursor) {
    await eventCursor.delete();
    eventCursor = await eventCursor.continue();
  }

  await tx.done;
}

// Virtual Files Storage
export async function saveVirtualFile(file: VirtualFile): Promise<void> {
  const db = await getDB();
  await db.put('files', file);
}

export async function getProjectFiles(projectId: string): Promise<VirtualFile[]> {
  const db = await getDB();
  return db.getAllFromIndex('files', 'by-project', projectId);
}

export async function getVirtualFile(projectId: string, path: string): Promise<VirtualFile | undefined> {
  const db = await getDB();
  return db.getFromIndex('files', 'by-project-path', [projectId, path]);
}

export async function deleteVirtualFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('files', id);
}

// Project Events
export async function addProjectEvent(event: ProjectEvent): Promise<void> {
  const db = await getDB();
  await db.put('events', event);
}

export async function getProjectEvents(projectId: string): Promise<ProjectEvent[]> {
  const db = await getDB();
  const events = await db.getAllFromIndex('events', 'by-project', projectId);
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Wipe all data completely (keys, bots, projects, files, events, localStorage)
 */
export async function wipeAllData(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  await indexedDB.deleteDatabase(DB_NAME);
  localStorage.clear();
  sessionStorage.clear();
}

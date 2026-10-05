/**
 * OpenScreens Virtual File Lock Manager
 * 
 * Strict rule: File locks are managed by the application, NEVER by the bots themselves.
 * When a bot requests to edit a file that is currently locked by another bot,
 * the manager immediately rejects the request with a structured "busy, pick another task"
 * signal without any blocking or polling loops.
 */

export interface LockInfo {
  botId: string;
  botName: string;
  acquiredAt: number;
}

export interface LockAcquireResult {
  success: boolean;
  isOwner: boolean;
  busy: boolean;
  heldBy?: {
    botId: string;
    botName: string;
    acquiredAt: number;
  };
  message: string;
}

class VirtualFileLockManager {
  // Map of `${projectId}:${filePath}` -> LockInfo
  private activeLocks: Map<string, LockInfo> = new Map();

  private getLockKey(projectId: string, filePath: string): string {
    // Normalize path (leading slashes, lowercase)
    const normalizedPath = filePath.trim().replace(/^\/+/, '').toLowerCase();
    return `${projectId}::${normalizedPath}`;
  }

  /**
   * Attempts to acquire an exclusive lock on a virtual file for a bot
   */
  acquireLock(
    projectId: string,
    filePath: string,
    botId: string,
    botName: string
  ): LockAcquireResult {
    const key = this.getLockKey(projectId, filePath);
    const existing = this.activeLocks.get(key);

    if (existing) {
      if (existing.botId === botId) {
        // Re-entrant lock for the same bot
        return {
          success: true,
          isOwner: true,
          busy: false,
          heldBy: existing,
          message: `Lock already held by ${botName}`,
        };
      }

      // Conflict: File is currently locked by another bot
      return {
        success: false,
        isOwner: false,
        busy: true,
        heldBy: existing,
        message: `busy, pick another task: "${filePath}" is locked by ${existing.botName}`,
      };
    }

    // Free file: acquire lock
    const lockInfo: LockInfo = {
      botId,
      botName,
      acquiredAt: Date.now(),
    };
    this.activeLocks.set(key, lockInfo);

    return {
      success: true,
      isOwner: true,
      busy: false,
      heldBy: lockInfo,
      message: `Lock successfully acquired for "${filePath}" by ${botName}`,
    };
  }

  /**
   * Releases a lock on a virtual file
   */
  releaseLock(projectId: string, filePath: string, botId: string): boolean {
    const key = this.getLockKey(projectId, filePath);
    const existing = this.activeLocks.get(key);

    if (!existing) {
      return true; // Already unlocked
    }

    if (existing.botId === botId) {
      this.activeLocks.delete(key);
      return true;
    }

    // Attempted to release someone else's lock
    return false;
  }

  /**
   * Checks who holds the lock for a given file
   */
  getLockOwner(projectId: string, filePath: string): LockInfo | null {
    const key = this.getLockKey(projectId, filePath);
    return this.activeLocks.get(key) || null;
  }

  /**
   * Checks if a file is currently locked
   */
  isLocked(projectId: string, filePath: string): boolean {
    const key = this.getLockKey(projectId, filePath);
    return this.activeLocks.has(key);
  }

  /**
   * Returns all active locks for a specific project
   */
  getProjectLocks(projectId: string): Record<string, LockInfo> {
    const result: Record<string, LockInfo> = {};
    const prefix = `${projectId}::`;

    for (const [key, info] of this.activeLocks.entries()) {
      if (key.startsWith(prefix)) {
        const filePath = key.substring(prefix.length);
        result[filePath] = info;
      }
    }
    return result;
  }

  /**
   * Release all locks held by a specific bot (e.g., when bot finishes or is paused)
   */
  releaseAllForBot(projectId: string, botId: string): string[] {
    const releasedPaths: string[] = [];
    const prefix = `${projectId}::`;

    for (const [key, info] of this.activeLocks.entries()) {
      if (key.startsWith(prefix) && info.botId === botId) {
        const filePath = key.substring(prefix.length);
        this.activeLocks.delete(key);
        releasedPaths.push(filePath);
      }
    }
    return releasedPaths;
  }

  /**
   * Force release all locks in a project
   */
  clearProjectLocks(projectId: string): void {
    const prefix = `${projectId}::`;
    for (const key of this.activeLocks.keys()) {
      if (key.startsWith(prefix)) {
        this.activeLocks.delete(key);
      }
    }
  }

  /**
   * Clear all locks across all projects (e.g. on reset)
   */
  clearAll(): void {
    this.activeLocks.clear();
  }
}

export const lockManager = new VirtualFileLockManager();
